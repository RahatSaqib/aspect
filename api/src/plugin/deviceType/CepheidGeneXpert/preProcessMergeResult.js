const _ = require('lodash')
const Boom = require('@hapi/boom')
const { createUniqueIdForResult } = require('../../../result/service')
const { assayNameToExternalId } = require('../../../shared/assayNameToExternalId')
const { getResultCategories, getAdditionalDataFromPayload } = require('../gxUtils')

/*
The purpose of this plugin is to ensure that results are captured
even when the assay name in the result is unknown to Aspect
If the device is unknown, ignore this request
If an unknown assay is detected, create it
*/
async function preProcessMergeResult(context) {
  const { partnerPluginName, deviceTypePluginName, knex, partnerId } = context
  const payload = context.payload.result

  const startedOn = _.get(payload, 'startedOn') || _.get(payload, 'endedOn')
  const endedOn = _.get(payload, 'endedOn') || startedOn
  if (!startedOn) {
    throw Boom.badRequest('Start date or end date is required for a result from GxConnect')
  }

  // Override assay.id
  const payloadAssayName = _.get(payload, 'data.assay', '')
  const mappedAssayExternalId = assayNameToExternalId[payloadAssayName.toUpperCase()] || 'GxUnknown'
  _.set(payload, 'assay.id', mappedAssayExternalId)

  if (!_.isEmpty(payload.data) && _.isEmpty(payload.category)) {
    const resultText = _.get(payload, 'data.resultText')
    payload.category = getResultCategories(mappedAssayExternalId, resultText)
  } else if (_.isEmpty(payload.data)) {
    payload.data = {}
  }

  const instrumentSerial = _.get(payload, 'instrument.serial', null)
  const cartridgeSerial = _.get(payload, 'consumable[0].serial', null)

  // Lazy load the loadPlugin function to avoid circular dependency, as we are in a plugin function already
  const { loadPlugin } = require('../../loadPlugin')
  const extractSampleIdPlugin = await loadPlugin(partnerPluginName, null, 'extractSampleId')
  const sampleId = extractSampleIdPlugin(payload)
  _.set(payload, 'sample.id', sampleId)

  if (payload.id) {
    payload.data.geneXpertTestId = payload.id
  }
  let generatedExternalId = createUniqueIdForResult(instrumentSerial, startedOn, endedOn, sampleId)
  const gxAlertUniqueId = _.get(payload, 'data.gxAlertTestUniqueId', generatedExternalId)
  const geneXpertTestId = _.get(payload, 'id') || _.get(payload, 'data.id')

  const potentialAssayIds = [mappedAssayExternalId]
  if (potentialAssayIds.includes('GxMtbRif') && !potentialAssayIds.includes('GxMtbRifUltra')) {
    potentialAssayIds.push('GxMtbRifUltra')
  }
  if (potentialAssayIds.includes('GxMtbRifUltra') && !potentialAssayIds.includes('GxMtbRif')) {
    potentialAssayIds.push('GxMtbRif')
  }

  const additionalData = getAdditionalDataFromPayload(payload, potentialAssayIds)
  payload.data = _.assign(payload.data, additionalData)

  const findResult = await loadPlugin(partnerPluginName, deviceTypePluginName, 'findResult')
  const resultFindings = await findResult(
    {
      partnerId,
      geneXpertTestId,
      gxAlertUniqueId,
      cartridgeSerial,
      instrumentSerial,
      potentialSampleIds: [sampleId],
      siteId: context.device.siteId,
      potentialAssayIds,
      startedOn: payload.startedOn,
    },
    knex
  )

  const { matchingResult: existingResult } = resultFindings

  if (existingResult) {
    context.existingResultId = existingResult.id // adding the existing result id to the context to make it available for the rest of the process

    if (_.get(existingResult, 'externalId') !== generatedExternalId) {
      try {
        await knex('Result').where('id', existingResult.id).update({ externalId: generatedExternalId })
      } catch (err) {
        // generatedExternalId = createUniqueIdForResult(... can return a duplicate value as explained
        //  in the comments to that function. If this update violates the unique constraints in the Result
        //  table, the externalId can remain as is and Aspect can uignore the error.
        if (err.code === 'ER_DUP_ENTRY') {
          generatedExternalId = payload.id ? payload.id : existingResult.externalId
        } else {
          throw err
        }
      }
    }
  }
  payload.id = generatedExternalId
}

module.exports = preProcessMergeResult
