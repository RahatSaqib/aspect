const _ = require('lodash')
const { subMonths } = require('date-fns')
const Boom = require('@hapi/boom')
const { knex, filterParams } = require('../../../db')
const { getAllUserMonthsInRange, getOffsetFromIsoDateStringInMinutes } = require('../../../shared/date')
const { getBaseQueryForFactResultsDeviceByTimeFrame } = require('../../../fact/common/db')
const { addConstraints } = require('../../../auth/constraints')

const getXpertWorkloadSummaryReport = async (dataConstraints, query, groupBy) => {
  const { minDate, maxDate } = query
  if (!minDate || !maxDate) {
    throw Boom.badRequest('Dates are required')
  }
  let dateFrom = _.isString(minDate) ? new Date(minDate) : minDate
  const dateTo = _.isString(maxDate) ? new Date(maxDate) : maxDate
  if (dateFrom >= dateTo) {
    dateFrom = subMonths(dateTo, 1)
  }

  const baseQuery = getBaseQueryForFactResultsDeviceByTimeFrame(knex, {
    addConstraints,
    dataConstraints,
    filterParams,
    query,
  })
    .leftJoin('Partner as ip', 'd.implementingPartnerId', 'ip.id')
    .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.id')
    .leftJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
    .select({
      provinceName: 'st.name',
      districtName: 'lg.name',
      deviceName: 'd.name',
      assayName: 'a.name',
      maintenanceStatus: 'dms.name',
      responsible: 'ip.name',
    })
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
        `IFNULL(SUM(CASE WHEN r.startedOn BETWEEN '${isoMinDate}' AND '${isoMaxDate}' THEN r.resultCount ELSE 0 END), 0)`
      ),
      [`${alias}_mtbDetectedTraceDetected`]: knex.raw(
        `IFNULL(SUM(CASE WHEN r.startedOn BETWEEN '${isoMinDate}' AND '${isoMaxDate}' AND rc1.externalId IN ('Detected', 'Trace Detected') THEN r.resultCount ELSE 0 END), 0)`
      ),
      [`${alias}_mtbTraceDetected`]: knex.raw(
        `IFNULL(SUM(CASE WHEN r.startedOn BETWEEN '${isoMinDate}' AND '${isoMaxDate}' AND rc1.externalId = 'Trace Detected' THEN r.resultCount ELSE 0 END), 0)`
      ),
      [`${alias}_mtbDetectedRifDetected`]: knex.raw(
        `IFNULL(SUM(CASE WHEN r.startedOn BETWEEN '${isoMinDate}' AND '${isoMaxDate}' AND rc1.externalId = 'Detected' AND rc2.externalId = 'Detected' THEN r.resultCount ELSE 0 END), 0)`
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

const addTotalRowByProvince = (rows, columnsToSum) => {
  const newData = []

  // Group rows by province
  const groupedRows = groupRowsByProvince(rows)

  // Add total row for each province and concatenate with original rows
  groupedRows.forEach(provinceGroup => {
    const { rows: provinceRows } = provinceGroup
    const totalRow = createTotalRow(provinceRows, columnsToSum)
    newData.push(totalRow, ...provinceRows)
  })

  return newData
}

// group rows by province
const groupRowsByProvince = rows => {
  const groupedRows = new Map()
  rows.forEach(row => {
    const { provinceName } = row
    if (!groupedRows.has(provinceName)) {
      groupedRows.set(provinceName, { provinceName, rows: [] })
    }
    groupedRows.get(provinceName).rows.push(row)
  })
  return Array.from(groupedRows.values())
}

// calculate sum of specified columns for a group of rows
const createTotalRow = (rows, columnsToSum) => {
  const totalRow = {
    provinceName: rows[0].provinceName,
    districtName: 'All',
  }
  columnsToSum.forEach(column => {
    totalRow[column] = rows.reduce((sum, row) => sum + row[column], 0)
  })
  return totalRow
}

const getXpertWorkloadSummaryReportByDistrict = async (dataConstraints, query) =>
  getXpertWorkloadSummaryReport(dataConstraints, query, ['g.lgaId'])

const getXpertWorkloadSummaryReportByDevice = async (dataConstraints, query) =>
  getXpertWorkloadSummaryReport(dataConstraints, query, ['r.deviceId', 'r.assayId'])

module.exports = {
  getXpertWorkloadSummaryReportByDevice,
  getXpertWorkloadSummaryReportByDistrict,
}
