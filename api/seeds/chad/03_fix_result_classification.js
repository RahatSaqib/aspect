module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const { getAdditionalDataFromPayload, getResultCategories } = require('../../src/plugin/deviceType/gxUtils')
const { assayNameToExternalId } = require('../../src/shared/assayNameToExternalId')
const { deepMerge } = require('../../src/shared/json')
const { getResultDataHash } = require('../../src/result/common/logic')
const { getResultCategoriesFromPayload } = require('../../src/deviceApi/utils')

async function seed(knex) {
  const { minId, maxId } = await knex('Result as r').first({
    minId: knex.raw('MIN(id)'),
    maxId: knex.raw('MAX(id)'),
  })

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
    const resultsToUpdate = await getResultsToUpdateInRange(knex, start, end)

    if (resultsToUpdate.length > 0) {
      // eslint-disable-next-line no-await-in-loop
      await knex('Result').insert(resultsToUpdate).onConflict('id').merge()
    }

    processed = end
  }
}

const getResultsToUpdateInRange = async (knex, minId, maxId) => {
  const range = [minId, maxId]

  const resultsToUpdate = await knex('Result as r')
    .join('Device as d', 'd.id', 'r.deviceId')
    .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .whereBetween('r.id', range)
    .andWhere('dt.externalId', 'CepheidGeneXpert')
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
        resultData: JSON.stringify(baseResult.resultData),
        resultDataHash: getResultDataHash(resultData),
      }
      transformedResults.push(transformedResult)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`skip resultId ${existingResult.id} - Error: ${error}`)
    }
  }

  return transformedResults
}
