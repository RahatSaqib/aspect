const _ = require('lodash')
const { format, parseISO, addMonths, differenceInMonths, differenceInBusinessDays, subMonths } = require('date-fns')
const locales = require('date-fns/locale')
const { getDeviceBaseQuery, listDevices } = require('../service')
const { exportData, getBaseReplacements } = require('../../shared/excel')
const { issueCategoryIntlToShortname, issueTypeToId } = require('../../shared/dictionary')
const { knex, filterDateRangeParams, filterParams, sortPageParams } = require('../../db')
const { getConstraints, addConstraints } = require('../../auth/constraints')
const {
  getMonthYearUserTimeZoneField,
  getOffsetFromIsoDateString,
  getDateTimeProjectionInUserTimeZone,
} = require('../../shared/date')
const { getUser } = require('../../auth/service')
const { getModuleActivityReportData } = require('./moduleActivityReport')
const { getModuleStatusReportData } = require('./moduleStatusReport')

async function exportDevices(request, reply) {
  const { data: dataSet } = await listDevices(request)
  const [devicesData] = dataSet
  const scope = devicesData.category !== 'Router' ? 'devices' : 'routers'

  const issueCategories = await issueCategoryIntlToShortname()
  // calculated and normalized props
  const data =
    scope === 'devices'
      ? dataSet.map(item => ({
          ...item,
          issuesCategories: _.map(item.issueCategories, ({ key }) => issueCategories[key]).join(', '),
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

function getMonthsDatefields(minDate, maxDate, culture) {
  const maxDateFormatted = _.isDate(maxDate) ? maxDate : parseISO(maxDate)
  const minDateFormatted = _.isDate(minDate) ? minDate : parseISO(minDate)
  const monthDiff = differenceInMonths(maxDateFormatted, minDateFormatted)
  const dateFields = []
  const locale = culture.split('-')[0].toLowerCase()
  for (let i = 0; i <= monthDiff + 1; i++) {
    dateFields.push({
      key: format(addMonths(minDateFormatted, i), 'yyyy-MM'),
      header: format(addMonths(minDateFormatted, i), 'yyyy-LLL', {
        locale: locales[locale],
      }),
    })
  }
  return dateFields
}

async function getDeviceActivityReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { culture } = await getUser(auth.credentials.name)
  const deviceQuery = getDeviceBaseQuery(query, dataConstraints)
  const { minDate = subMonths(new Date(), 12), maxDate = new Date() } = query
  const offset = getOffsetFromIsoDateString(maxDate)

  const addingGroupingAndSelect = (builder, { select, groupBy }) => {
    if (select) builder.select(select)
    if (groupBy) builder.groupBy(groupBy)
  }
  // get rows
  const getItems = deviceQuery
    .clone()
    .leftJoin('Result as r', builder => {
      builder.on('d.id', 'r.deviceId').andOn(knex.raw('r.endedOn between ? and ?', [minDate, maxDate]))
    })
    .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.id')
    .leftJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
    .select('d.id', 'd.name', 'd.serial', 'da.name as deviceApprovalStatus', 'dms.name as deviceMaintenanceStatus')
    .countDistinct('r.id as totalResults')
    .select(getDateTimeProjectionInUserTimeZone(knex, 'MAX(r.endedOn)', offset, 'lastUploadOn'))
    .innerJoin('Assay as a', 'dt.id', 'a.deviceTypeId')
    .groupBy('d.id', 'd.name', 'd.serial')
    .modify(sortPageParams, query, 'name')
    .modify(addingGroupingAndSelect, query)

  const deviceResultsPerMonths = await deviceQuery
    .clone()
    .join('Result as r', 'd.id', 'r.deviceId')
    .countDistinct('r.id as totalResults')
    .select('d.id as deviceId', getMonthYearUserTimeZoneField(knex, 'r.endedOn', 'monthYear', { offsetValue: offset }))
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .groupBy('d.id', 'monthYear')
    .innerJoin('Assay as a', 'dt.id', 'a.deviceTypeId')
    .modify(addingGroupingAndSelect, query)

  // return result when both queries are finished
  const [data, deviceDetails] = await Promise.all([getItems, deviceResultsPerMonths])
  const dateFields = getMonthsDatefields(minDate, maxDate, culture)
  const extraField = query.select ? query.select.split(' as ')[1].trim() : null

  const devices = _.map(data, elem => {
    _.each(
      _.filter(
        deviceDetails,
        filteredElem =>
          filteredElem.deviceId === elem.id && (extraField ? elem[extraField] === filteredElem[extraField] : true)
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
    minDateFormatted = minDate ? parseISO(minDate) : subMonths(new Date(), 12),
    maxDateFormatted = maxDate ? parseISO(maxDate) : new Date(),
  } = query

  const issueTypeId = await issueTypeToId('ModuleReplaced')
  // get rows
  const devices = await getDeviceBaseQuery(query, dataConstraints)
    .clone()
    .innerJoin('Issue as i', 'i.deviceId', 'd.id')
    .join('Result as newModuleResult', 'i.resultid', 'newModuleResult.id')
    .join('Result as oldResult', builder => builder.on(knex.raw('i.data->>"$.oldResultId" = oldResult.id ')))
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
      knex.raw('COALESCE(newModuleResult.endedOn,newModuleResult.startedOn) as lastResultNewModule'),
      knex.raw('COALESCE(oldResult.endedOn,oldResult.startedOn) as lastResultOldModule')
    )
    .andWhere(knex.raw('i.createdOn between ? and ?', [minDateFormatted, maxDateFormatted]))
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
  const offset = getOffsetFromIsoDateString(query.maxDate)
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
    .select(getDateTimeProjectionInUserTimeZone(knex, 'i.createdOn', offset, 'triggeredOn'))
    .select(
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

async function exportDeviceOperationLogReport(request, reply) {
  const { auth, query } = request
  const { data, replacements } = await getGeneXpertOperationLogsReport(auth, query)

  // default to `xlsx`, notice that query validation allows only 'xlsx', 'csv', or empty/no param
  const sheetData = {
    data,
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }

  return exportData(request, reply, sheetData, 'device_operation_logs', {
    replacements,
  })
}

async function getDeviceCapacityReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { culture } = await getUser(auth.credentials.name)
  let { minDate } = query
  const { maxDate } = query

  const offset = getOffsetFromIsoDateString(maxDate)

  minDate = minDate || addMonths(new Date(), -12).toISOString()

  const deviceQuery = getDeviceBaseQuery(query, dataConstraints)

  /**
   * 1. Read all devices with effective timezone
   * (take first defined timezone from `device` or `site` or `country` tables)
   */
  const devices = deviceQuery
    .clone()
    .innerJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('TimeZone as tzDevice', 'd.timezone', 'tzDevice.id')
    .leftJoin('TimeZone as tzSite', 's.timezoneid', 'tzSite.id')
    .leftJoin('TimeZone as tzCountry', 'c.timezone', 'tzCountry.id')
    .where({ 'dt.externalId': 'CepheidGeneXpert' })
    .groupBy('d.id')
    .select('d.name', 'd.id', knex.raw('COALESCE(tzDevice.name, tzSite.name, tzCountry.name) as timezone'))
    .orderBy('d.name')
  let deviceDetails = await devices
  /**
   * 2. add offset hours which need to cut from timezone
   */
  deviceDetails = deviceDetails.map(it => {
    let offset = it.timezone
    if (!offset) {
      offset = '+00:00'
    } else {
      const offsetStartingLabel = '(UTC'
      const j = it.timezone.indexOf(offsetStartingLabel)
      if (j === -1) {
        offset = '+00:00'
      } else {
        offset = _.trim(it.timezone.substring(j + offsetStartingLabel.length), ') ')
        offset = _.replace(offset, ' ', '')
      }
    }
    return {
      ...it,
      offset,
    }
  })
  /**
   * 3. assemble query to return list of `deviceId` and `offset` for each device
   */
  const subQueryForTimezoneOffset = deviceDetails
    .map(it => `SELECT ${it.id} as deviceId, "${it.offset}" as offset`)
    .join(' UNION ')
  /**
   * 4. join to the above list of deviceId/offset in order to use
   * device's timezone offset in CONVERT_TZ
   */
  const monthlyCapacity = deviceQuery
    .clone()
    .innerJoin(knex.raw(`(${subQueryForTimezoneOffset}) as tz on d.id = tz.deviceId`))
    .join('DeviceCapacity as dcap', 'd.deviceCapacityId', 'dcap.id')
    .leftJoin('Result as r', builder =>
      builder
        .on('d.id', 'r.deviceId')
        .andOn(knex.raw('DATE(r.endedOn) between date(?) and date(?)', [minDate, maxDate]))
        .andOn(knex.raw('DAYOFWEEK(r.endedOn) not in (1,7)'))
    )
    .where({ 'dt.externalId': 'CepheidGeneXpert' })
    .groupBy('d.id', 'monthYear')
    .select(
      'd.name',
      getMonthYearUserTimeZoneField(knex, 'r.endedOn', 'monthYear', { offsetField: 'tz.offset' }),
      'd.id AS deviceId',
      knex.raw('COUNT(DISTINCT r.id) as resultCount'),
      knex.raw(
        `CASE
              WHEN DATE(NOW()) < date(LAST_DAY(r.endedOn)) THEN date(CONVERT_TZ(now(), "+00:00","${offset}"))
              ELSE DATE(LAST_DAY(r.endedOn))
            END as lastDayOfMonth`
      ),
      'dcap.dailyCapacity'
    )
    .orderBy('d.name')

  const capacityData = await monthlyCapacity

  // loop though all devices and count rate
  const data = _.map(deviceDetails, deviceRow => {
    _.each(
      _.filter(capacityData, deviceFiltered => deviceFiltered.deviceId === deviceRow.id),
      filteredMonthlyCapacity => {
        const workingDays = differenceInBusinessDays(
          filteredMonthlyCapacity.lastDayOfMonth,
          format(new Date(`${filteredMonthlyCapacity.monthYear}-01`), 'yyyy-MM') ===
            format(new Date(minDate), 'yyyy-MM')
            ? parseISO(minDate)
            : new Date(`${filteredMonthlyCapacity.monthYear}-01`)
        )
        deviceRow[filteredMonthlyCapacity.monthYear] = _.round(
          filteredMonthlyCapacity.resultCount / Math.max(filteredMonthlyCapacity.dailyCapacity * workingDays, 1),
          2
        )
      }
    )

    return deviceRow
  })

  const dataset = {
    ok: true,
    total: data.length,
    length: data.length,
    data,
    dynamicColumns: getMonthsDatefields(minDate, maxDate, culture),
  }
  return dataset
}

async function getGeneXpertOperationLogsReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)

  const {
    minDate,
    maxDate,
    minDateFormatted = minDate ? parseISO(minDate) : subMonths(new Date(), 12),
    maxDateFormatted = maxDate ? parseISO(maxDate) : new Date(),
  } = query
  // get rows

  const deviceData = await knex('Device as d')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .where('d.id', query.deviceId)
    .first('d.name as deviceName', 's.name as siteName')
  const data = await knex('Device as d')
    .join('DeviceOperation as dl', 'dl.deviceId', 'd.id')
    .join('Site as s', 'd.siteId', 's.id')
    .join('Geography as g', 'd.geographyId', 'g.id')
    .modify(filterDateRangeParams, { minDate: minDateFormatted, maxDate: maxDateFormatted }, 'dl.startedOn')
    .modify(filterParams, query, {
      deviceId: 'd.id',
    })
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      geography: 'g',
      site: 's',
    })
    .select(
      'dl.startedOn as createdOn',
      's.name as siteName',
      'd.name as deviceName',
      knex.raw("dl.data ->> '$.details' as logDetails"),
      knex.raw("dl.data ->> '$.logLevel' as logLevel"),
      knex.raw("dl.data ->> '$.details.RawText' as message"),
      knex.raw("dl.data ->> '$.details.Errors' as errors"),
      knex.raw("dl.data ->> '$.type' as logType"),
      knex.raw("dl.data ->> '$.details.Calibrations' as calibrations")
    )

  const dataset = {
    ok: true,
    total: data.length,
    length: data.length,
    data,
    replacements: [
      {
        placeholder: '<date>',
        value: format(new Date(), 'yyyy-MM-dd'),
      },
      {
        placeholder: '<deviceName>',
        value: deviceData.deviceName,
      },
      {
        placeholder: '<siteName>',
        value: deviceData.siteName,
      },
    ],
  }
  return dataset
}

async function getModuleActivityReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { minDate } = query
  const rows = await getModuleActivityReportData(minDate, dataConstraints, query)

  return {
    ok: true,
    data: rows,
    total: rows.length,
  }
}

async function getModuleStatusReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { minDate, maxDate } = query
  const rows = await getModuleStatusReportData(minDate, maxDate, dataConstraints, query)

  return {
    ok: true,
    data: rows,
    total: rows.length,
  }
}

module.exports = {
  exportDevices,
  getDeviceActivityReport,
  getModuleSwapsReport,
  getGeneXpertIssuesReport,
  getGeneXpertOperationLogsReport,
  exportDeviceOperationLogReport,
  getDeviceCapacityReport,
  getModuleActivityReport,
  getModuleStatusReport,
}
