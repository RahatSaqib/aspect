const { format } = require('date-fns')
const { exportData, getBaseReplacements } = require('../../shared/excel')
const { listDevices } = require('../listDevices')
const { knex, filterParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')
const { getBaseQueryForFactResultsDeviceByTimeFrame } = require('../../fact/common/db')
const { allResultCategoryToId } = require('../../shared/dictionary')

async function deviceReport(request, reply) {
  const { data: dataSet } = await listDevices(request)
  const [devicesData] = dataSet
  const scope = devicesData.category !== 'Router' ? 'devices' : 'routers'

  // calculated and normalized props
  const data =
    scope === 'devices'
      ? dataSet.map(item => ({
          ...item,
          availabilityRate: item.availability.rate, // Excel column formatted as 'Percentage'
          errorRate: item.error.rate, // Excel column formatted as 'Percentage'
        }))
      : dataSet.map(item => ({
          ...item,
          lastPingOn: format(new Date(item.lastPingOn), 'yyyy-MM-dd'),
          lastSeen: format(new Date(item.lastSeen), 'yyyy-MM-dd HH:mm:ss'),
        }))
  //
  const sheetData = {
    data,
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }

  return exportData(request, reply, sheetData, scope, {
    replacements: getBaseReplacements(),
  })
}

async function getDevicesByTBReach(dataConstraints, query) {
  const resultCategoryIds = await allResultCategoryToId()

  const data = await getBaseQueryForFactResultsDeviceByTimeFrame(knex, {
    addConstraints,
    dataConstraints,
    filterParams,
    query,
    timeFrame: 'day',
  })
    .sum({
      totalXpertTests: 'r.resultCount',
      xpertPositive: knex.raw(`
        case when r.resultCategory1 = ${resultCategoryIds.Detected} OR r.resultCategory1 = ${resultCategoryIds['Trace Detected']}
        then r.resultCount 
        else 0 
        end`),
      xpertNegative: knex.raw(`
        case when r.resultCategory1 = ${resultCategoryIds.NotDetected}
        then r.resultCount 
        else 0 
        end`),
      xpertRIFIndeterminate: knex.raw(`
        CASE 
          WHEN (r.resultCategory1 = ${resultCategoryIds.Detected} OR r.resultCategory1 = ${resultCategoryIds['Trace Detected']}) 
               AND r.resultCategory2 = ${resultCategoryIds.Indeterminate} 
          THEN r.resultCount 
          ELSE 0 
        END`),
      xpertRIFPositive: knex.raw(`
        case when r.resultCategory2 = ${resultCategoryIds.Detected} 
        then r.resultCount 
        else 0 
        end`),
    })
    .select({
      deviceId: 'd.id',
    })
    .modify(filterParams, query, {
      assayIds: 'a.id',
    })
    .groupBy('r.deviceId')
    .orderBy('st.name', 'lg.name')

  return data
}
module.exports = {
  deviceReport,
  getDevicesByTBReach,
}
