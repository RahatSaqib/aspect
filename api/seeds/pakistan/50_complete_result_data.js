module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const { getAdditionalDataFromPayload } = require('../../src/plugin/deviceType/gxUtils')
const { getPartnerByExternalId } = require('../utils')
const {
  partner: { externalId: partnerExternalId },
  partnerAbbreviation: countryAbbreviation,
} = require('./fixtures/partnerData')
const { getResultDataHash } = require('../../src/result/common/logic')
const { getCustomFieldsFromPayload } = require('../../src/forms/service')
const { assayNameToExternalId } = require('../../src/shared/assayNameToExternalId')
const { deepMerge } = require('../../src/shared/json')
const { allAssayToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerExternalId)
  const assayIds = await allAssayToId()
  const { minResultId, maxResultId } = await knex('Result').first({
    minResultId: knex.raw('MIN(id)'),
    maxResultId: knex.raw('MAX(id)'),
  })

  const batchSize = 100
  const startFrom = minResultId
  const endAt = maxResultId

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

const getResultsToUpdateInRange = async (knex, assayIds, partnerId, minResultId, maxResultId) => {
  const range = [minResultId, maxResultId]

  const resultsToUpdate = await knex('Result as r')
    .join('DeviceLog as dl', 'dl.id', 'r.lastDeviceLogId')
    .whereBetween('r.id', range)
    .select({ resultId: 'r.id', payload: 'dl.rawMessage' })

  return Promise.all(
    resultsToUpdate.map(async data => {
      const { resultId } = data
      const payload = JSON.parse(data.payload)
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

      const customFieldsData = await getCustomFieldsFromPayload(payload.result, countryAbbreviation, partnerId, assayId)
      const additionalData = getAdditionalDataFromPayload(payload.result, potentialAssayIds)
      const baseResult = {
        id: resultId,
        ...customFieldsData,
        consumableLot: _.get(payload, 'result.consumable[0].lot'),
        resultData: deepMerge(payload.result.data, additionalData),
        patientData: deepMerge(payload.result.patient, customFieldsData.patientData),
      }

      const resultToUpdate = {
        ...baseResult,
        resultData: JSON.stringify(baseResult.resultData),
        resultDataHash: getResultDataHash(baseResult.resultData),
        patientData: !_.isEmpty(baseResult.patientData) ? JSON.stringify(baseResult.patientData) : null,
      }
      return resultToUpdate
    })
  )
}
