const { getResultDataHash } = require('../../src/result/common/logic')

exports.seed = async function (knex) {
  const startDate = '2022-11-06'

  const { minResultId, maxResultId } = await knex('Result')
    .where('createdOn', '>=', startDate)
    .whereRaw("JSON_CONTAINS_PATH(resultData, 'one', '$.analytes')")
    .first({
      minResultId: knex.raw('MIN(id)'),
      maxResultId: knex.raw('MAX(id)'),
    })

  const batchSize = 100
  const startFrom = minResultId - 1
  const endAt = maxResultId

  let processed = startFrom

  while (processed < endAt) {
    const start = processed + 1
    const end = Math.min(processed + batchSize, endAt)
    console.log(`Processing batch: ${start}-${end}`)

    // eslint-disable-next-line no-await-in-loop
    const resultsToUpdate = await getResultsToUpdateInRange(knex, start, end)

    if (resultsToUpdate.length > 0) {
      await Promise.all(resultsToUpdate.map(result => {
        const resultUpdate = knex('Result')
          .where('id', result.id)
          .update({
            resultData: result.resultData,
            resultDataHash: result.resultDataHash,
          })

        const deviceLogUpdate = knex('DeviceLog')
          .where('resultId', result.id)
          .where(knex.raw(`JSON_CONTAINS_PATH(rawMessage, 'one', '$.result.data.analytes')`))
          .update({
            rawMessage: knex.raw(`JSON_REMOVE(rawMessage, '$.result.data.testData', '$.result.data.analytes')`)
          })

        return Promise.all([resultUpdate, deviceLogUpdate])
      }))

    }
    processed = end
  }
}

const getResultsToUpdateInRange = async (knex, minResultId, maxResultId) => {
  const range = [minResultId, maxResultId]
  const resultsToUpdate = await knex('Result as r')
    .select({ resultId: 'r.id', resultData: 'r.resultData' })
    .whereBetween('r.id', range)
    .whereRaw("JSON_CONTAINS_PATH(resultData, 'one', '$.analytes')")

  return Promise.all(
    resultsToUpdate.map(async data => {
      const { resultId, resultData } = data

      const parsedResultData = JSON.parse(resultData)

      delete parsedResultData.analytes
      delete parsedResultData.testData

      const resultDataHash = getResultDataHash(parsedResultData)

      return {
        id: resultId,
        resultData: JSON.stringify(parsedResultData),
        resultDataHash,
      }
    })
  )
}