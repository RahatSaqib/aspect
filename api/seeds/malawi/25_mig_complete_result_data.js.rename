module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const { getAdditionalDataFromPayload } = require('../../src/plugin/deviceType/gxUtils')
const { getPartnerByExternalId } = require('../utils')
const {
  partner: { externalId: partnerExternalId },
  partnerAbbreviation: countryAbbreviation,
} = require('./fixtures/partnerData')
const { getCustomFieldsFromPayload } = require('../../src/forms/service')
const { assayNameToExternalId } = require('../../src/shared/assayNameToExternalId')
const { deepMerge } = require('../../src/shared/json')
const { allAssayToId } = require('../../src/shared/dictionary')
const { mergeResultWithPayload } = require('../../src/result/common/logic')

async function seed(knex) {
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerExternalId)
  const assayIds = await allAssayToId()
  await knex('DeviceLog')
  const { minDeviceLogId, maxDeviceLogId } = await knex('DeviceLog')
    .whereNotNull('resultId') // Only result payloads
    .first({
      minDeviceLogId: knex.raw('MIN(id)'),
      maxDeviceLogId: knex.raw('MAX(id)'),
    })

  const batchSize = 1000
  const startFrom = minDeviceLogId
  const endAt = maxDeviceLogId

  let processed = startFrom - 1
  while (processed < endAt) {
    const start = processed + 1
    const end = Math.min(processed + batchSize, endAt)
    // eslint-disable-next-line no-console
    console.log(`processing batch: ${start}-${end}`)

    // eslint-disable-next-line no-await-in-loop
    const resultsToUpdate = await getResultsToUpdateInRange(knex, assayIds, partnerId, start, end)

    if (resultsToUpdate.length > 0) {
      // eslint-disable-next-line no-await-in-loop
      await knex('Result').insert(resultsToUpdate).onConflict('id').merge()
    }

    processed = end
  }
}

const getResultsToUpdateInRange = async (knex, assayIds, partnerId, minDeviceLogId, maxDeviceLogId) => {
  const range = [minDeviceLogId, maxDeviceLogId]

  const resultsToUpdate = await knex('Result as r')
    .join('DeviceLog as dl', 'dl.resultId', 'r.id')
    .whereBetween('dl.id', range)
    .select('r.*', 'dl.rawMessage')

  const transformedResults = []
  for (const resultToUpdate of resultsToUpdate) {
    const { rawMessage, ...existingResult } = resultToUpdate

    try {
      const payload = JSON.parse(rawMessage)
      const payloadAssayName = _.get(payload.result, 'data.assay', '')

      const mappedAssayExternalId = assayNameToExternalId[payloadAssayName.toUpperCase()] || 'GxUnknown'
      const potentialAssayIds = [mappedAssayExternalId]
      if (potentialAssayIds.includes('GxMtbRif') && !potentialAssayIds.includes('GxMtbRifUltra')) {
        potentialAssayIds.push('GxMtbRifUltra')
      }
      if (potentialAssayIds.includes('GxMtbRifUltra') && !potentialAssayIds.includes('GxMtbRif')) {
        potentialAssayIds.push('GxMtbRif')
      }
      const assayId = assayIds[mappedAssayExternalId]

      const { patientData, resultData, resultDataHash } = mergeResultWithPayload(existingResult, payload.result)

      // eslint-disable-next-line no-await-in-loop
      const customFieldsData = await getCustomFieldsFromPayload(payload.result, countryAbbreviation, partnerId, assayId)
      const additionalData = getAdditionalDataFromPayload(payload.result, potentialAssayIds)

      const baseResult = {
        ...existingResult,
        ...customFieldsData,
        resultData: deepMerge(resultData, { ...customFieldsData.resultData, ...additionalData }),
        patientData: deepMerge(patientData, {
          ...customFieldsData.patientData,
        }),
      }

      const transformedResult = {
        ...baseResult,
        patientData: JSON.stringify(baseResult.patientData),
        resultData: JSON.stringify(baseResult.resultData),
        resultDataHash,
      }
      transformedResults.push(transformedResult)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`skip resultId ${existingResult.id} - Error: ${error}`)
    }
  }

  return transformedResults
}
