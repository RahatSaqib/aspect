const _ = require('lodash')
const { startOfMonth, endOfMonth, subMonths } = require('date-fns')
const { getBaseQuery: getResultBaseQuery, modifiers } = require('../../../result/query')
const { filterDateRangeParams, knex, filterParams } = require('../../../db')
const { getOffsetFromIsoDateStringInMinutes, getAllUserMonthsInRange } = require('../../../shared/date')

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
    .leftJoin('Partner as ip', 'd.implementingPartnerId', 'ip.id')
    .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.id')
    .leftJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .select({
      provinceName: 'st.name',
      districtName: 'lg.name',
      deviceName: 'd.name',
      assayName: 'a.name',
      maintenanceStatus: 'dms.name',
      responsible: 'ip.name',
    })
    .modify(filterParams, query, {
      assayId: 'a.id',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteId: 's.id',
    })
    .modify(filterDateRangeParams, { minDate: dateFrom, maxDate: dateTo }, 'r.endedOn')
    .groupBy(groupBy)
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra'])
    .orderBy('st.name', 'lg.name')

  const offset = getOffsetFromIsoDateStringInMinutes(query.minDate || query.maxDate)
  const dateRanges = getAllUserMonthsInRange(dateFrom, dateTo, offset)
  const totalColumns = []

  for (const dateRange of dateRanges) {
    const { userMonth, minDate, maxDate } = dateRange

    const alias = `resultsCount${userMonth}`

    const isoMinDate = minDate.toISOString()
    const isoMaxDate = maxDate.toISOString()

    baseQuery.select({
      [`${alias}_total`]: knex.raw(
        `IFNULL(SUM(CASE WHEN r.endedOn BETWEEN '${isoMinDate}' AND '${isoMaxDate}' THEN 1 ELSE 0 END), 0)`
      ),
      [`${alias}_mtbDetectedTraceDetected`]: knex.raw(
        `IFNULL(SUM(CASE WHEN r.endedOn BETWEEN '${isoMinDate}' AND '${isoMaxDate}' AND rc1.externalId IN ('Detected', 'Trace Detected') THEN 1 ELSE 0 END), 0)`
      ),
      [`${alias}_mtbTraceDetected`]: knex.raw(
        `IFNULL(SUM(CASE WHEN r.endedOn BETWEEN '${isoMinDate}' AND '${isoMaxDate}' AND rc1.externalId = 'Trace Detected' THEN 1 ELSE 0 END), 0)`
      ),
      [`${alias}_mtbDetectedRifDetected`]: knex.raw(
        `IFNULL(SUM(CASE WHEN r.endedOn BETWEEN '${isoMinDate}' AND '${isoMaxDate}' AND rc1.externalId = 'Detected' AND rc2.externalId = 'Detected' THEN 1 ELSE 0 END), 0)`
      ),
    })

    totalColumns.push(
      ...[
        `${alias}_total`,
        `${alias}_mtbDetectedTraceDetected`,
        `${alias}_mtbTraceDetected`,
        `${alias}_mtbDetectedRifDetected`,
      ]
    )
  }

  const data = await baseQuery
  const newData = addTotalRowByProvince(data, totalColumns)

  const dynamicColumns = [
    { key: 'total', name: 'GXpert Tested' },
    { key: 'mtbDetectedTraceDetected', name: 'MTB+ve (incudingTrace)' },
    { key: 'mtbTraceDetected', name: 'MTB+ve (Trace-only)' },
    { key: 'mtbDetectedRifDetected', name: 'Rif Resistant' },
  ].map(column => ({
    header: column.name,
    subHeaders: dateRanges.map(({ userMonth }) => ({
      key: `resultsCount${userMonth}_${column.key}`,
      text: userMonth,
    })),
  }))

  return { data: newData, dynamicColumns }
}

const sumOfColumns = (rows, columns) => {
  // Create a seed object with all columns as keys and initializing them with zero
  const countersSeed = columns.reduce((object, column) => {
    return { ...object, [column]: 0 }
  }, {})

  // Sum all the columns
  return rows.reduce((counters, row) => {
    columns.forEach(column => {
      counters[column] += row[column]
    })
    return counters
  }, countersSeed)
}

const addTotalRowByProvince = (rows, columnsToSum) => {
  const newData = []
  let group = [] // group of rows with the same province
  for (const [i, row] of rows.entries()) {
    const isLastRow = i === rows.length - 1

    group.push(row)

    const shouldCreateNewGroup = isLastRow || (group.length > 0 && group[0].provinceName !== row.provinceName)
    if (shouldCreateNewGroup) {
      const { provinceName } = group[0]
      const counters = sumOfColumns(group, columnsToSum)

      // Add total row before the group of rows
      newData.push({
        provinceName,
        districtName: 'All',
        ...counters,
      })

      // Add rows of the group
      newData.push(...group)

      // Start a new group
      group = []
    }
  }

  return newData
}

const getXpertWorkloadSummaryReportByDistrict = async (dataConstraints, query) =>
  getXpertWorkloadSummaryReport(dataConstraints, query, ['g.lgaId', 'ip.id', 'r.assayId'])

const getXpertWorkloadSummaryReportByDevice = async (dataConstraints, query) =>
  getXpertWorkloadSummaryReport(dataConstraints, query, ['r.deviceId', 'r.assayId'])

module.exports = {
  getXpertWorkloadSummaryReportByDevice,
  getXpertWorkloadSummaryReportByDistrict,
}
