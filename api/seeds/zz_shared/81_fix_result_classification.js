module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const { getAdditionalDataFromPayload, getResultCategories } = require('../../src/plugin/deviceType/gxUtils')
const { assayNameToExternalId } = require('../../src/shared/assayNameToExternalId')
const { deepMerge } = require('../../src/shared/json')
const { getResultDataHash } = require('../../src/result/common/logic')
const { getResultCategoriesFromPayload } = require('../../src/deviceApi/utils')

async function seed(knex) {
  const { minId, maxId } = await knex('Result as r')
    .join('Device as d', 'd.id', 'r.deviceId')
    .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .join('Assay as a', 'a.id', 'r.assayId')
    .join('ResultCategory as rc', 'rc.id', 'r.resultCategory1')
    .andWhere('dt.externalId', 'CepheidGeneXpert')
    .andWhere(qb => {
      qb.where('a.externalId', 'GxUnknown')
      qb.orWhere('a.externalId', 'GxHcv')
      qb.orWhere('rc.externalId', 'Success')
      qb.orWhere('rc.externalId', 'NoResult')
    })
    .first({
      minId: knex.raw('MIN(r.id)'),
      maxId: knex.raw('MAX(r.id)'),
    })

  // Nothing to do
  if (!minId || !maxId) return

  const assays = await getAssayExternalIdToIdMap(knex)

  const batchSize = 1000
  const startFrom = minId
  const endAt = maxId

  let processed = startFrom - 1
  while (processed < endAt) {
    const start = processed + 1
    const end = Math.min(processed + batchSize, endAt)
    // eslint-disable-next-line no-console
    console.log(`processing batch: ${start}-${end}`)

    // eslint-disable-next-line no-await-in-loop
    const resultsToUpdate = await getResultsToUpdateInRange(knex, start, end, assays)

    if (resultsToUpdate.length > 0) {
      // eslint-disable-next-line no-await-in-loop
      await knex('Result').insert(resultsToUpdate).onConflict('id').merge()
    }

    processed = end
  }
}

const getResultsToUpdateInRange = async (knex, minId, maxId, assays) => {
  const range = [minId, maxId]

  const resultsToUpdate = await knex('Result as r')
    .join('Device as d', 'd.id', 'r.deviceId')
    .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .join('Assay as a', 'a.id', 'r.assayId')
    .join('ResultCategory as rc', 'rc.id', 'r.resultCategory1')
    .whereBetween('r.id', range)
    .andWhere('dt.externalId', 'CepheidGeneXpert')
    .andWhere(qb => {
      qb.where('a.externalId', 'GxUnknown')
      qb.orWhere('rc.externalId', 'Success')
      qb.orWhere('rc.externalId', 'NoResult')
    })
    .select('r.*')

  const transformedResults = []
  for (const resultToUpdate of resultsToUpdate) {
    const existingResult = resultToUpdate

    try {
      const resultData = JSON.parse(existingResult.resultData)

      const payloadAssayName = _.get(resultData, 'assay', '')

      const mappedAssayExternalId = assayNameToExternalId[payloadAssayName.toUpperCase()] || 'GxUnknown'
      const potentialAssayIds = [mappedAssayExternalId]
      if (potentialAssayIds.includes('GxMtbRif') && !potentialAssayIds.includes('GxMtbRifUltra')) {
        potentialAssayIds.push('GxMtbRifUltra')
      }
      if (potentialAssayIds.includes('GxMtbRifUltra') && !potentialAssayIds.includes('GxMtbRif')) {
        potentialAssayIds.push('GxMtbRif')
      }

      const additionalData = getAdditionalDataFromPayload({ data: resultData }, potentialAssayIds)

      const resultText = _.get(resultData, 'resultText', '')
      const categoryIds = getResultCategories(mappedAssayExternalId, resultText)
      const assayId = assays[mappedAssayExternalId]
      if (!assayId) {
        // eslint-disable-next-line no-console
        console.log(`Assay with externalId ${mappedAssayExternalId} not found`)
        // eslint-disable-next-line no-continue
        continue
      }

      // eslint-disable-next-line no-await-in-loop
      const { resultCategory1, resultCategory2 } = await getResultCategoriesFromPayload({ category: categoryIds })

      const baseResult = {
        ...existingResult,
        resultCategory1,
        resultCategory2,
        resultData: deepMerge(resultData, { ...additionalData }),
      }

      const transformedResult = {
        ...baseResult,
        // eslint-disable-next-line no-await-in-loop
        assayId,
        resultData: JSON.stringify(baseResult.resultData),
        resultDataHash: getResultDataHash(baseResult.resultData),
      }
      transformedResults.push(transformedResult)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`skip resultId ${existingResult.id} - Error: ${error}`)
    }
  }

  return transformedResults
}

async function getAssayExternalIdToIdMap(knex) {
  const assays = await knex('Assay').select('externalId', 'id')
  return assays.reduce((acc, assay) => {
    acc[assay.externalId] = assay.id
    return acc
  }, {})
}
