const _ = require('lodash')
const { knex, filterDateRangeParams, filterParams } = require('../../db')
const { getBaseQuery: getResultBaseQuery, modifiers } = require('../../result/query')
const { getBasicsForDevicesReport } = require('../common/db')

/**
 * ---------------------------------------------
 * helper funcs
 * ---------------------------------------------
 */
function getResultsCountBase(knex, dataConstraints, query) {
  return getResultBaseQuery(knex, dataConstraints)
    .clone()
    .modify(modifiers.join.resultCategory1)
    .count({
      totalErrors: knex.raw(`
        DISTINCT
        CASE
          WHEN rc1.externalId = 'Error'
          THEN r.id
          ELSE null
        END
      `),
      totalResults: knex.raw('DISTINCT r.id'),
    })
    .select({
      lastUpload: knex.raw('MAX(r.endedOn)'),
      senderOperator: 'r.senderOperator',
    })
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .modify(filterParams, query, {
      assayId: 'a.id',
    })
}

function getResultsCount(knex, dataConstraints, query) {
  return getResultsCountBase(knex, dataConstraints, query).select({
    deviceId: 'r.deviceId',
  })
}

function getDevices(deviceQuery, resultsCount) {
  return deviceQuery
    .clone()
    .leftJoin(resultsCount.as('resultsCount'), function () {
      this.on('resultsCount.deviceId', 'd.id')
    })
    .select({
      deviceName: 'd.name',
      deviceSerial: 'd.serial',
      siteName: 's.name',
      state: 'st.name',
      lga: 'lg.name',
      lastUpload: 'resultsCount.lastUpload',
      totalErrors: knex.raw('IFNULL(resultsCount.totalErrors, 0)'),
      totalResults: knex.raw('IFNULL(resultsCount.totalResults, 0)'),
      errorRate: knex.raw(`
        CASE
        WHEN IFNULL(resultsCount.totalResults, 0) = 0 
        THEN 0
        ELSE
          ROUND(
            IFNULL(resultsCount.totalErrors, 0)
            /
            IFNULL(resultsCount.totalResults, 0),
            2
          )
        END
      `),
    })
}

/**
 * get error rates - by devices
 */
async function getErrorRateByDevice(dataConstraints, query) {
  const { deviceQuery } = await getBasicsForDevicesReport(dataConstraints, query)

  const resultsCount = getResultsCount(knex, dataConstraints, query).clone().groupBy('r.deviceId')

  const data = getDevices(deviceQuery, resultsCount)
    .groupBy('d.id')
    .orderBy([
      { column: 'errorRate', order: 'desc' },
      { column: 'deviceName', order: 'asc' },
    ])

  return data
}

/**
 * get error rates - by modules
 */
async function getErrorRateByModule(dataConstraints, query) {
  const { deviceQuery } = await getBasicsForDevicesReport(dataConstraints, query)

  const resultsCount = getResultsCount(knex, dataConstraints, query)
    .clone()
    .select({
      moduleSerial: 'r.moduleSerial',
      moduleName: 'r.moduleName',
    })
    .groupBy('r.deviceId', 'r.moduleSerial', 'r.moduleName')

  const data = getDevices(deviceQuery, resultsCount)
    .groupBy('d.id', 'resultsCount.moduleSerial', 'resultsCount.moduleName')
    .select({
      moduleName: 'resultsCount.moduleName',
      moduleSerial: 'resultsCount.moduleSerial',
    })
    .orderBy([
      { column: 'errorRate', order: 'desc' },
      { column: 'deviceName', order: 'asc' },
      { column: 'moduleName', order: 'asc' },
    ])

  return data
}

/**
 * get error rates - by sender operator
 */
async function getErrorRateByUser(dataConstraints, query) {
  let data = await getResultsCountBase(knex, dataConstraints, query).groupBy('r.senderOperator')
  data = data.map(it => {
    it.errorRate = it.totalResults === 0 ? 0 : it.totalErrors / it.totalResults
    return it
  })
  data = _.orderBy(data, ['errorRate', 'senderOperator'], ['desc', 'asc'])

  return data
}

module.exports = {
  getErrorRateByDevice,
  getErrorRateByModule,
  getErrorRateByUser,
}
