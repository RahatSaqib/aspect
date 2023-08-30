const _ = require('lodash')
const { knex, sortPageParams, filterDateRangeParams, filterParams } = require('../../db')
const {
  getBaseQuery: getResultBaseQuery,
  modifiers,
  SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY,
} = require('../../result/query')
const { getBasicsForDevicesReport } = require('../common/db')

async function getErrorsByDevices(dataConstraints, query) {
  const { deviceQuery } = await getBasicsForDevicesReport(dataConstraints, query)
  const { mtbNoResultInvalidIndeterminate, mtbErrorByCode, mtbOtherErrorsNotIn } = SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY

  const errorCodes = [5011, 5007, 5006, 2008, 2005, 2037, 2025, 2022]
  const errorCodesCsv = errorCodes.map(errorCode => `'${errorCode}'`).join(',')
  const byErrorCodes = _.reduce(
    errorCodes,
    (acc, errorCode) => ({ ...acc, [`${errorCode}`]: mtbErrorByCode(errorCode) }),
    {}
  )

  const resultsCount = getResultBaseQuery(knex, dataConstraints)
    .modify(modifiers.join.resultCategory1)
    .modify(modifiers.join.resultCategory2)
    .select({
      deviceId: 'r.deviceId',
      ...byErrorCodes,
      invalidResults: mtbNoResultInvalidIndeterminate,
      otherErrors: mtbOtherErrorsNotIn(errorCodesCsv),
    })
    .modify(filterParams, query, {
      assayId: 'a.id',
    })
    .groupBy('r.deviceId')
    .modify(filterDateRangeParams, query, 'r.endedOn')

  return deviceQuery
    .clone()
    .leftJoin(resultsCount.as('resultsCount'), function () {
      this.on('resultsCount.deviceId', 'd.id')
    })
    .whereNot('dt.externalId', 'GxAlert')
    .groupBy('d.id')
    .modify(sortPageParams, query, 'deviceName')
    .select([
      'd.name as deviceName',
      ...errorCodes.map(errorCode => knex.raw(`IFNULL(resultsCount.\`${errorCode}\`, 0) AS \`${errorCode}\``)),
      knex.raw('IFNULL(resultsCount.otherErrors, 0) AS otherErrors'),
      knex.raw('IFNULL(resultsCount.invalidResults, 0) AS invalidResults'),
    ])
}

module.exports = {
  getErrorsByDevices,
}
