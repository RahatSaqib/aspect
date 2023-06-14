const _ = require('lodash')
const { startOfMonth, endOfMonth, subMonths } = require('date-fns')
const { getBaseQuery: getResultBaseQuery, modifiers } = require('../../../result/query')
const { filterDateRangeParams, knex } = require('../../../db')
const { getAllMonthsInRange } = require('../../../shared/date')

const getXpertWorkloadSummaryReport = async (dataConstraints, query, groupBy) => {
  const now = new Date()
  const { minDate = startOfMonth(now), maxDate = endOfMonth(now) } = query
  let dateFrom = _.isString(minDate) ? new Date(minDate) : minDate
  const dateTo = _.isString(maxDate) ? new Date(maxDate) : maxDate
  if (dateFrom >= dateTo) {
    dateFrom = subMonths(dateTo, 1)
  }

  const baseQuery = getResultBaseQuery(knex, dataConstraints)
    .modify(modifiers.join.resultCategory1)
    .modify(modifiers.join.resultCategory2)
    .leftJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .select({
      provinceName: 'st.name',
      districtName: 'lg.name',
      deviceName: 'd.name',
      assayName: 'a.name',
      approvalStatus: 'da.name',
      responsible: knex.raw(`'Aspect'`),
    })
    .groupBy(groupBy)
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra'])
    .modify(filterDateRangeParams, { minDate: dateFrom, maxDate: dateTo }, 'r.endedOn')
    .orderBy('st.name', 'lg.name')

  const dateRanges = getAllMonthsInRange(dateFrom.toISOString(), dateTo.toISOString())

  for (const dateRange of dateRanges) {
    const date = new Date(`${dateRange}-01`)
    const minDate = startOfMonth(date).toISOString()
    const maxDate = endOfMonth(date).toISOString()

    const alias = `resultsCount${dateRange}`

    baseQuery.select({
      [`${alias}_total`]: knex.raw(
        `IFNULL(SUM(CASE WHEN r.endedOn BETWEEN '${minDate}' AND '${maxDate}' THEN 1 ELSE 0 END), 0)`
      ),
      [`${alias}_mtbDetectedTraceDetected`]: knex.raw(
        `IFNULL(SUM(CASE WHEN r.endedOn BETWEEN '${minDate}' AND '${maxDate}' AND rc1.externalId IN ('Detected', 'Trace Detected') THEN 1 ELSE 0 END), 0)`
      ),
      [`${alias}_mtbTraceDetected`]: knex.raw(
        `IFNULL(SUM(CASE WHEN r.endedOn BETWEEN '${minDate}' AND '${maxDate}' AND rc1.externalId = 'Trace Detected' THEN 1 ELSE 0 END), 0)`
      ),
      [`${alias}_mtbDetectedRifDetected`]: knex.raw(
        `IFNULL(SUM(CASE WHEN r.endedOn BETWEEN '${minDate}' AND '${maxDate}' AND rc1.externalId = 'Detected' AND rc2.externalId = 'Detected' THEN 1 ELSE 0 END), 0)`
      ),
    })
  }

  // Add summary row per provinceName
  const data = await baseQuery
  const newData = []
  let group = []
  for (const row of data) {
    if (group.length > 0 && group[0].provinceName !== row.provinceName) {
      const keys = Object.keys(group[0]).filter(key => key.startsWith('resultsCount'))

      const counters = group.reduce((prev, current) => {
        const object = {}
        keys.forEach(key => {
          object[key] = (prev[key] || 0) + current[key]
        })
        return object
      }, {})
      newData.push({
        provinceName: group[0].provinceName,
        districtName: 'All',
        deviceName: '',
        assayName: '',
        responsible: '',
        approvalStatus: '',
        ...counters,
      })
      newData.push(...group)
      group = []
    }
    group.push(row)
  }

  const dynamicColumns = [
    { key: 'total', name: 'GXpert Tested' },
    { key: 'mtbDetectedTraceDetected', name: 'MTB+ve (incudingTrace)' },
    { key: 'mtbTraceDetected', name: 'MTB+ve (Trace-only)' },
    { key: 'mtbDetectedRifDetected', name: 'Rif Resistant' },
  ].map(column => ({
    header: column.name,
    subHeaders: dateRanges.map(dateRange => ({
      key: `resultsCount${dateRange}_${column.key}`,
      text: dateRange,
    })),
  }))

  return { data: newData, dynamicColumns }
}

const getXpertWorkloadSummaryReportByDistrict = async (dataConstraints, query) =>
  getXpertWorkloadSummaryReport(dataConstraints, query, ['g.lgaId'])

const getXpertWorkloadSummaryReportByDevice = async (dataConstraints, query) =>
  getXpertWorkloadSummaryReport(dataConstraints, query, ['r.deviceId', 'r.assayId'])

module.exports = {
  getXpertWorkloadSummaryReportByDevice,
  getXpertWorkloadSummaryReportByDistrict,
}
