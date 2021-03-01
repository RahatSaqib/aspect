const _ = require('lodash')
const { format, parseISO, addMonths, differenceInMonths } = require('date-fns')
const locales = require('date-fns/locale')
const { listDevices } = require('./service')
const { exportData, getBaseReplacements } = require('../shared/excel')
const {
  issueCategoryIntlToShortname,
  issueTypeToId,
} = require('../shared/dictionary')
const { getDeviceBaseQuery } = require('./service')
const {
  knex,
  filterDateRangeParams,
  filterParams,
  sortPageParams,
} = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
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
  const deviceQuery = getDeviceBaseQuery(query, dataConstraints)
  const { minDate = addMonths(new Date(), -12), maxDate = new Date() } = query
  const offset = getOffsetFromIsoDateString(maxDate)

  // get rows
  const getItems = deviceQuery
    .clone()
    .leftJoin('Result as r', builder => {
      builder
        .on('d.id', 'r.deviceId')
        .andOn(knex.raw('r.endedOn between ? and ?', [minDate, maxDate]))
    })
    .leftJoin(
      'DeviceMaintenanceStatusLog as dmsl',
      'd.deviceMaintenanceStatusLogId',
      'dmsl.id'
    )
    .leftJoin(
      'DeviceMaintenanceStatus as dms',
      'dmsl.deviceMaintenanceStatusId',
      'dms.id'
    )
    .select(
      'd.id',
      'd.name',
      'd.serial',
      'da.name as deviceApprovalStatus',
      'dms.name as deviceMaintenanceStatus'
    )
    .countDistinct('r.id as totalResults')
    .max('r.endedOn as lastUploadOn')
    .groupBy('d.id', 'd.name', 'd.serial')
    .modify(sortPageParams, query, 'name')
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

async function getModuleSwapsReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const {
    minDate,
    maxDate,
    minDateFormatted = minDate ? parseISO(minDate) : addMonths(new Date(), -12),
    maxDateFormatted = maxDate ? parseISO(maxDate) : new Date(),
  } = query

  const issueTypeId = await issueTypeToId('ModuleReplaced')
  // get rows
  const devices = await getDeviceBaseQuery(query, dataConstraints, true, true)
    .clone()
    .innerJoin('Issue as i', 'i.deviceId', 'd.id')
    .join('Result as newModuleResult', 'i.resultid', 'newModuleResult.id')
    .join('Result as oldResult', builder =>
      builder.on(knex.raw('i.data->>"$.oldResultId" = oldResult.id '))
    )

    .select(
      'd.name as deviceName',
      'd.serial',
      'newModuleResult.moduleName',
      'newModuleResult.instrumentSerial',
      'newModuleResult.moduleSerial as newModuleSerial',
      'oldResult.moduleSerial as oldModuleSerial',
      knex.raw(
        'DATEDIFF(COALESCE(newModuleResult.endedOn,newModuleResult.startedOn), COALESCE(oldResult.endedOn,oldResult.startedOn)) as daysDifference'
      ),
      'da.name as deviceApprovalStatus',
      knex.raw(
        'COALESCE(newModuleResult.endedOn,newModuleResult.startedOn) as lastResultNewModule'
      ),
      knex.raw(
        'COALESCE(oldResult.endedOn,oldResult.startedOn) as lastResultOldModule'
      )
    )
    .andWhere(
      knex.raw('i.createdOn between ? and ?', [
        minDateFormatted,
        maxDateFormatted,
      ])
    )
    .andWhere('i.issueTypeId', issueTypeId)
    .modify(sortPageParams, query, 'name')
  const dataset = {
    ok: true,
    total: devices.length,
    length: devices.length,
    data: devices,
  }
  return dataset
}

async function getGeneXpertIssuesReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)

  // get rows
  const issues = await knex('Issue as i')
    .join('IssueType as it', 'i.issueTypeId', 'it.id')
    .join('IssueEventTrigger as iet', 'it.id', 'iet.issueTypeId')
    .join('Device as d', 'i.deviceId', 'd.id')
    .join('Site as s', 'i.siteId', 's.id')
    .join('Geography as g', 'i.geographyId', 'g.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('Result as r', 'i.resultId', 'r.id')
    .where(function () {
      this.where('it.externalId', 'like', '%Lot')
        .orWhere('it.externalId', 'like', '%Module')
        .orWhere('it.externalId', 'like', 'Hardware%')
    })
    .modify(filterDateRangeParams, query, 'i.createdOn')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      deviceName: 'd.name',
      deviceApprovalId: 'd.deviceApprovalId',
      deviceTypeId: 'd.deviceTypeId',
      siteExternalId: 's.externalId',
      siteName: 's.name',
    })
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      deviceType: 'dt',
      geography: 'g',
      site: 's',
    })
    .modify(sortPageParams, query, 'i.createdOn')
    .select(
      'i.createdOn as triggeredOn',
      's.name as siteName',
      'st.name as stateName',
      'l.name as lgaName',
      'r.instrumentSerial as instrumentSerial',
      'it.name as error',
      knex.raw(
        "replace(replace(iet.triggerConditions ->> '$.conditions.evaluationFilterParameters.errorCodes', '[', ''), ']', '') as errorCodes"
      ),
      knex.raw("i.data ->> '$.totalResults' as totalResults"),
      knex.raw("i.data ->> '$.resultsWithErrors' as resultsWithErrors"),
      knex.raw("i.data ->> '$.moduleSerial' as moduleSerial"),
      knex.raw("i.data ->> '$.consumableLot' as consumableLot")
    )

  const data = issues.map(issue => ({
    ...issue,
    errorPercentage: issue.resultsWithErrors / issue.totalResults,
  }))

  const dataset = {
    ok: true,
    total: data.length,
    length: data.length,
    data,
  }
  return dataset
}

module.exports = {
  exportDevices,
  getDeviceActivityReport,
  getModuleSwapsReport,
  getGeneXpertIssuesReport,
}
