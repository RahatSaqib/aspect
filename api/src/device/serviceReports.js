const _ = require('lodash')
const { format, parseISO, addMonths, differenceInMonths } = require('date-fns')
const locales = require('date-fns/locale')
const { listDevices } = require('./service')
const { exportData, getBaseReplacements } = require('../shared/excel')
const { issueCategoryIntlToShortname } = require('../shared/dictionary')
const { getDeviceBaseQuery } = require('./service')
const { knex, filterDateRangeParams } = require('../db')
const { getConstraints } = require('../auth/constraints')
const {
  getMonthYearUserTimeZoneField,
  getOffsetFromIsoDateString,
} = require('../shared/date')
const { getUser } = require('../auth/service')

async function exportDevices(request, reply) {
  const { data } = await listDevices(request)
  const [devicesData] = data
  const scope = devicesData.category !== 'Router' ? 'devices' : 'routers'

  const issueCategories = await issueCategoryIntlToShortname()
  // calculated and normalized props
  const dataRows =
    scope === 'devices'
      ? data.map(item => ({
          ...item,
          issuesCategories: _.map(
            item.issueCategories,
            ({ key }) => issueCategories[key]
          ).join(', '),
          availabilityRate: item.availability.rate, // Excel column formatted as 'Percentage'
          errorRate: item.error.rate, // Excel column formatted as 'Percentage'
        }))
      : data.map(item => ({
          ...item,
          lastPingOn: format(new Date(item.lastPingOn), 'yyyy-MM-dd'),
          lastSeen: format(new Date(item.lastSeen), 'yyyy-MM-dd HH:mm:ss'),
        }))
  //
  const sheetData = {
    dataRows,
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }

  return exportData(request, reply, sheetData, scope, {
    replacements: getBaseReplacements(),
  })
}

async function getDeviceActivityReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { culture } = await getUser(auth.credentials.name)
  const deviceQuery = getDeviceBaseQuery(query, dataConstraints, true, true)
  const { minDate = addMonths(new Date(), -12), maxDate = new Date() } = query
  const offset = getOffsetFromIsoDateString(maxDate)

  // get rows
  const getItems = deviceQuery
    .clone()
    .leftJoin('Result as r', 'd.id', 'r.deviceId')
    .select('d.id', 'd.name', 'd.serial')
    .countDistinct('r.id as totalResults')
    .max('r.endedOn as lastUploadOn')
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .groupBy('d.id', 'd.name', 'd.serial')
    .orderBy('d.name')

  const deviceResultsPerMonths = await deviceQuery
    .clone()
    .join('Result as r', 'd.id', 'r.deviceId')
    .countDistinct('r.id as totalResults')
    .select(
      'd.id as deviceId',
      getMonthYearUserTimeZoneField(knex, 'r.endedOn', 'monthYear', offset)
    )
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .groupBy(
      'd.id',
      getMonthYearUserTimeZoneField(knex, 'r.endedOn', null, offset)
    )

  // return result when both queries are finished
  const [data, deviceDetails] = await Promise.all([
    getItems,
    deviceResultsPerMonths,
  ])
  const maxDateFormatted = _.isDate(maxDate) ? maxDate : parseISO(maxDate)
  const minDateFormatted = _.isDate(minDate) ? minDate : parseISO(minDate)
  const monthDiff = differenceInMonths(maxDateFormatted, minDateFormatted)
  const dateFields = []
  const locale = culture.split('-')[0].toLowerCase()
  for (let i = 0; i <= monthDiff; i++) {
    dateFields.push({
      key: format(addMonths(minDateFormatted, i), 'yyyy-MM'),
      header: format(addMonths(minDateFormatted, i), 'yyyy-LLL', {
        locale: locales[locale],
      }),
    })
  }

  const devices = _.map(data, elem => {
    _.each(
      _.filter(
        deviceDetails,
        filteredElem => filteredElem.deviceId === elem.id
      ),
      detail => {
        elem[detail.monthYear] = detail.totalResults
      }
    )

    return elem
  })
  const dataset = {
    ok: true,
    total: devices.length,
    length: devices.length,
    data: devices,
    dynamicColumns: dateFields,
  }
  return dataset
}

module.exports = {
  exportDevices,
  getDeviceActivityReport,
}
