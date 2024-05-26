const { getResultDataHash } = require('../../src/result/common/logic')

exports.seed = async function (knex) {
  await Promise.all([processResults(knex), processDeviceLogs(knex)])
}

const getRange = async (knex, tableName, startDate, condition) => {
  return knex(tableName)
    .where('createdOn', '>=', startDate)
    .whereRaw(condition)
    .first({
      minId: knex.raw('MIN(id)'),
      maxId: knex.raw('MAX(id)'),
    })
}

const processResults = async knex => {
  const startDate = '2022-11-06'

  const { minId: minResultId, maxId: maxResultId } = await getRange(
    knex,
    'Result',
    startDate,
    "JSON_CONTAINS_PATH(resultData, 'one', '$.analytes')"
  )

  const resultBatchSize = 100
  let resultProcessed = minResultId - 1
  const resultEndAt = maxResultId

  while (resultProcessed < resultEndAt) {
    const start = resultProcessed + 1
    const end = Math.min(resultProcessed + resultBatchSize, resultEndAt)

    // eslint-disable-next-line no-await-in-loop
    const resultsToUpdate = await getResultsToUpdateInRange(knex, start, end, startDate)

    if (resultsToUpdate.length > 0) {
      await knex('Result').insert(resultsToUpdate).onConflict('id').merge()
    }
    resultProcessed = end
  }
}

const processDeviceLogs = async knex => {
  const logStartDate = '2024-02-26' // day before earliest log date
  const { minId: minDeviceLogId, maxId: maxDeviceLogId } = await getRange(
    knex,
    'DeviceLog',
    logStartDate,
    "JSON_CONTAINS_PATH(rawMessage, 'one', '$.result.data.analytes')"
  )

  const deviceLogBatchSize = 100
  let deviceLogProcessed = minDeviceLogId - 1
  const deviceLogEndAt = maxDeviceLogId

  while (deviceLogProcessed < deviceLogEndAt) {
    const start = deviceLogProcessed + 1
    const end = Math.min(deviceLogProcessed + deviceLogBatchSize, deviceLogEndAt)

    // eslint-disable-next-line no-await-in-loop
    const deviceLogsToUpdate = await getDeviceLogsInRange(knex, start, end, logStartDate)

    if (deviceLogsToUpdate.length > 0) {
      await knex('DeviceLog').insert(deviceLogsToUpdate).onConflict('id').merge()
    }
    deviceLogProcessed = end
  }
}

// Function to fetch and process results in the given range
const getResultsToUpdateInRange = async (knex, minResultId, maxResultId, startDate) => {
  const range = [minResultId, maxResultId]
  const resultsToUpdate = await knex('Result as r')
    .select({
      resultId: 'r.id',
      resultData: 'r.resultData',
      assayId: 'r.assayId',
      partnerId: 'r.partnerId',
      deviceId: 'r.deviceId',
      resultSourceId: 'r.resultSourceId',
      resultTypeId: 'r.resultTypeId',
      sampleId: 'r.sampleId',
      reportableSiteId: 'r.reportableSiteId',
    })
    .whereBetween('r.id', range)
    .where('createdOn', '>=', startDate)
    .whereRaw("JSON_CONTAINS_PATH(resultData, 'one', '$.analytes')")

  return resultsToUpdate.map(data => {
    const {
      resultId,
      resultData,
      assayId,
      partnerId,
      resultSourceId,
      resultTypeId,
      sampleId,
      reportableSiteId,
      deviceId,
    } = data

    const parsedResultData = JSON.parse(resultData)

    delete parsedResultData.analytes
    delete parsedResultData.testData

    const resultDataHash = getResultDataHash(parsedResultData)

    return {
      id: resultId,
      resultData: JSON.stringify(parsedResultData),
      resultDataHash,
      assayId,
      partnerId,
      resultSourceId,
      resultTypeId,
      sampleId,
      reportableSiteId,
      deviceId,
    }
  })
}

// Function to fetch DeviceLogs in the given range
const getDeviceLogsInRange = async (knex, minLogId, maxLogId, logStartDate) => {
  const deviceLogs = await knex('DeviceLog as dl')
    .whereBetween('dl.id', [minLogId, maxLogId])
    .where(knex.raw(`JSON_CONTAINS_PATH(rawMessage, 'one', '$.result.data.analytes')`))
    .where('createdOn', '>=', logStartDate)
    .select({
      id: 'dl.id',
      source: 'dl.source',
      senderIp: 'dl.senderIp',
      createdOn: 'dl.createdOn',
      rawMessage: knex.raw(`JSON_REMOVE(rawMessage, '$.result.data.testData', '$.result.data.analytes')`),
    })

  return deviceLogs.map(log => ({
    id: log.id,
    source: log.source,
    senderIp: log.senderIp,
    createdOn: log.createdOn,
    rawMessage: log.rawMessage,
  }))
}
