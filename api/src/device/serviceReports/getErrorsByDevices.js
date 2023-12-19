const _ = require('lodash')
const { knex, sortPageParams, filterParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')
const { getBasicsForDevicesReport } = require('../common/db')
const { getBaseQueryForFactResultsDeviceByTimeFrame } = require('../../fact/common/db')
const { allResultCategoryToId } = require('../../shared/dictionary')

async function getErrorsByDevices(dataConstraints, query) {
  const { deviceQuery } = await getBasicsForDevicesReport(dataConstraints, query)
  const resultCategoryIds = await allResultCategoryToId()
  const errorCodes = [5011, 5007, 5006, 2008, 2005, 2037, 2025, 2022]

  const devices = await deviceQuery
    .distinct(['d.id as deviceId', 'd.name as deviceName'])
    .modify(sortPageParams, query, 'd.name')

  const allCounts = await getBaseQueryForFactResultsDeviceByTimeFrame(knex, {
    addConstraints,
    dataConstraints,
    filterParams,
    query,
    timeFrame: 'day',
  })
    .groupBy('r.deviceId')
    .sum({
      ..._.reduce(
        errorCodes,
        (acc, errorCode) => ({
          ...acc,
          [`${errorCode}`]: knex.raw(`
              CASE
                WHEN r.resultCategory1 = ${resultCategoryIds.Error}
                THEN r.xdrResistanceCounts ->> '$.errors."${errorCode}"'
                ELSE 0
              END`),
        }),
        {}
      ),
      otherErrors: knex.raw(`
        CASE 
          WHEN r.resultCategory1 = ${resultCategoryIds.Error}
          THEN r.xdrResistanceCounts ->> "$.errors.other" 
          ELSE 0
        END`),
      invalidResults: knex.raw(`
        CASE 
          WHEN r.resultCategory1 IN (${resultCategoryIds.NoResult}, ${resultCategoryIds.Invalid}, ${resultCategoryIds.Indeterminate})
          THEN r.xdrResistanceCounts ->> "$.errors.invalid" 
          ELSE 0
        END`),
    })
    .select(['d.name as deviceName', 'd.id as deviceId'])
    .modify(sortPageParams, query, 'd.name')

  const emptyCounts = {
    ..._.reduce(
      errorCodes,
      (acc, errorCode) => ({
        ...acc,
        [`${errorCode}`]: 0,
      }),
      {}
    ),
    otherErrors: 0,
    invalidResults: 0,
  }
  const data = devices.map(({ deviceName, deviceId }) => {
    const counts = allCounts.find(it => it.deviceId === deviceId) || emptyCounts
    return {
      deviceName,
      ...counts,
    }
  })

  return data
}

module.exports = {
  getErrorsByDevices,
}
