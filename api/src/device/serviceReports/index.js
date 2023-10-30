const _ = require('lodash')
const { format, parseISO, addMonths, differenceInBusinessDays, subMonths } = require('date-fns')
const locales = require('date-fns/locale')
const { getDeviceBaseExtendedQuery } = require('../service')
const { exportData, getBaseReplacements } = require('../../shared/excel')
const { issueCategoryIntlToShortname } = require('../../shared/dictionary')
const { knex, filterDateRangeParams, filterParams, sortPageParams } = require('../../db')
const { getConstraints, addConstraints } = require('../../auth/constraints')
const {
  getMonthYearUserTimeZoneField,
  getOffsetFromIsoDateString,
  getDateTimeProjectionInUserTimeZone,
} = require('../../shared/date')
const { lastDayOfMonthByOffsetAndResultEndedOn } = require('../../shared/query')
const { getPersonByPersonId } = require('../../auth/service')
const { getModuleActivityReportData } = require('./moduleActivityReport')
const { getDoNotUseModulesReportData } = require('./doNotUseModulesReport')
const { getModuleStatusReportData } = require('./moduleStatusReport')
const getDevicesWithCountsForTB = require('./genXpertTbWorkloadReport')
const { getAllDeviceReportData } = require('./devicesAndSitesOverviewReport')
const { getResultCategoryGroupColumns } = require('../common/db')
const { getErrorsByDevices } = require('./getErrorsByDevices')
const { getErrorRateByDevice, getErrorRateByModule, getErrorRateByUser } = require('./errorRatesReport')
const { getNoStockInventoryReport } = require('./noStockInventoryReport')
const { listDevices } = require('../listDevices')
const { getModuleSwapsReportData } = require('./moduleSwapsReport')
const { INTERNAL_DEVICE_IDS } = require('../../shared/constants')

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

  const dateFields = []
  const locale = culture.split('-')[0].toLowerCase()

  let curMonth = minDateFormatted
  while (curMonth <= maxDateFormatted) {
    dateFields.push({
      key: format(curMonth, 'yyyy-MM'),
      header: `${format(curMonth, 'yyyy-LLL', {
        locale: locales[locale],
      })}\n (%)`,
    })
    curMonth = addMonths(curMonth, 1)
  }
  return dateFields
}

async function getDeviceActivityReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { culture } = await getPersonByPersonId(auth.credentials.personId)
  const deviceQuery = getDeviceBaseExtendedQuery(query, dataConstraints, { extendJoinToAssays: true }).whereNotIn(
    'dt.externalId',
    ['Aspect', 'GxAlert']
  )
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
    .distinct(
      'd.id',
      'd.name',
      'd.serial',
      'da.name as deviceApprovalStatus',
      'dms.name as deviceMaintenanceStatus',
      getDateTimeProjectionInUserTimeZone(knex, 'MAX(r.updatedOn)', offset, 'lastUploadOn')
    )
    .countDistinct('r.id as totalResults')
    .groupBy('d.id', 'd.name', 'd.serial')
    .modify(sortPageParams, query, 'name')
    .modify(addingGroupingAndSelect, query)

  const deviceResultsPerMonths = await deviceQuery
    .clone()
    .join('Result as r', 'd.id', 'r.deviceId')
    .countDistinct('r.id as totalResults')
    .distinct('d.id as deviceId', getMonthYearUserTimeZoneField(knex, 'r.endedOn', 'monthYear', offset))
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .groupBy('d.id', 'monthYear')
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

  const moduleSwapsReport = await getModuleSwapsReportData(dataConstraints, query)

  const dataset = {
    ok: true,
    total: moduleSwapsReport.data.rows.length,
    length: moduleSwapsReport.data.rows.length,
    ...moduleSwapsReport,
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
  const { culture } = await getPersonByPersonId(auth.credentials.personId)
  let { minDate } = query
  const { maxDate } = query

  const offset = getOffsetFromIsoDateString(maxDate)

  minDate = minDate || addMonths(new Date(), -12).toISOString()

  const deviceQuery = getDeviceBaseExtendedQuery(query, dataConstraints, { extendJoinToAssays: true })
  const monthlyCapacity = deviceQuery
    .clone()
    .join('DeviceCapacity as dcap', 'd.deviceCapacityId', 'dcap.id')
    .leftJoin('Result as r', builder =>
      builder
        .on('d.id', 'r.deviceId')
        .andOn(knex.raw('DATE(r.endedOn) between date(?) and date(?)', [minDate, maxDate]))
        .andOn(knex.raw('DAYOFWEEK(r.endedOn) not in (1,7)'))
    )
    .where({ 'dt.externalId': 'CepheidGeneXpert' })
    .groupBy('d.id', 'monthYear')
    .distinct(
      'd.name',
      getMonthYearUserTimeZoneField(knex, 'r.endedOn', 'monthYear', offset),
      'd.id AS deviceId',
      knex.raw('COUNT(DISTINCT r.id) as resultCount'),
      lastDayOfMonthByOffsetAndResultEndedOn(knex, offset, 'lastDayOfMonth'),
      'dcap.dailyCapacity'
    )
    .orderBy('d.name')

  const devices = deviceQuery
    .clone()
    .whereNotIn('dt.externalId', ['GxAlert', 'Aspect'])
    .groupBy('d.id')
    .select('d.name', 'd.id')
    .orderBy('d.name')
  // return result when both queries are finished

  const [capacityData, deviceDetails] = await Promise.all([monthlyCapacity, devices])

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
          (filteredMonthlyCapacity.resultCount * 100) /
            Math.max(filteredMonthlyCapacity.dailyCapacity * workingDays, 1),
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
  const { minDate = subMonths(new Date(), 1) } = query
  const rows = await getModuleActivityReportData(minDate, dataConstraints, query)

  return {
    ok: true,
    data: rows,
    total: rows.length,
  }
}

async function getDoNotUseModulesReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { minDate = subMonths(new Date(), 1) } = query
  const rows = await getDoNotUseModulesReportData(minDate, dataConstraints, query)

  return {
    ok: true,
    data: rows,
    total: rows.length,
  }
}

async function getModuleStatusReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const rows = await getModuleStatusReportData(dataConstraints, query)

  return {
    ok: true,
    data: rows,
    total: rows.length,
  }
}

async function getDevicesWithCountsForTBReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const rows = await getDevicesWithCountsForTB(dataConstraints, query)

  return {
    ok: true,
    data: rows,
    total: rows.length,
  }
}

async function getErrorRateByDeviceReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const data = await getErrorRateByDevice(dataConstraints, { ...query, hasResults: true })
  return {
    ok: true,
    total: data.length,
    length: data.length,
    data,
  }
}

async function getErrorRateByModuleReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const data = await getErrorRateByModule(dataConstraints, query)
  return {
    ok: true,
    total: data.length,
    length: data.length,
    data,
  }
}

async function getErrorRateByUserReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const data = await getErrorRateByUser(dataConstraints, query)
  return {
    ok: true,
    total: data.length,
    length: data.length,
    data,
  }
}

async function getAllDeviceReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const resultCategoryGroups = await getResultCategoryGroupColumns(dataConstraints, query)
  const { builder } = await getAllDeviceReportData(resultCategoryGroups, dataConstraints, query)
  const rows = await builder

  return {
    ok: true,
    data: rows,
    total: rows.length,
    dynamicColumns: resultCategoryGroups.map(a => ({
      key: a.columnKey,
      header: a.columnName,
    })),
  }
}

async function getErrorsByDevicesReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const data = await getErrorsByDevices(dataConstraints, query)
  return {
    ok: true,
    total: data.length,
    length: data.length,
    data,
  }
}

async function noStockInventoryReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { data, dynamicColumns } = await getNoStockInventoryReport(dataConstraints, query)
  return {
    ok: true,
    total: data.length,
    length: data.length,
    data,
    dynamicColumns,
  }
}

async function getDeviceCoverageReport(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const geographies = await knex('Geography as g')
    .innerJoin('Country as c', 'c.id', 'g.countryId')
    .leftJoin('State as s', 's.id', 'g.stateId')
    .leftJoin('Lga as l', 'l.id', 'g.lgaId')
    .modify(addConstraints, dataConstraints, { geography: 'g' })
    .orderBy(['c.name', 's.name', 'l.name'], 'asc')
    .select(
      'g.id as geographyId',
      'c.id as countryId',
      'c.name as countryName',
      's.id as stateId',
      's.name as stateName',
      'l.id as lgaId',
      'l.name as lgaName'
    )
  const allSites = await knex('Site as s')
    .innerJoin('SiteType as st', 's.siteTypeId', 'st.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as sta', 'g.stateId', 'sta.id')
    .leftOuterJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .whereNotIn('s.externalId', INTERNAL_DEVICE_IDS)
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
      externalId: 's.externalId',
    })
    .orderBy('s.name')
    .select([
      's.id as siteId',
      's.name as siteName',
      's.shortName as siteShortName',
      'sta.id as stateId',
      'lg.id as lgaId',
      's.createdOn',
      's.externalId',
    ])

  let id = 1
  const rawDevices = await getDeviceBaseExtendedQuery(query, dataConstraints, { extendJoinToAssays: true })
    .whereNotIn('dt.externalId', ['Aspect', 'GxAlert'])
    // .leftJoin('Country as c', 'g.countryId', 'c.id')
    .distinct([
      // 'c.id as countryId',
      // 'c.name as countryName',
      'st.id as stateId',
      'st.name as stateName',
      'lg.id as lgaId',
      'lg.name as lgaName',
      's.id as siteId',
      's.name as siteName',
      'd.id as deviceId',
      'd.name as deviceName',
      'd.configurationData',
    ])
    .orderBy('st.name', 'lg.name', 's.name', 'd.name')
  /**
   * assemble hierarchy
   */
  let nestedData = _.reduce(
    geographies,
    (acc, item) => {
      const { stateId, stateName, lgaId, lgaName } = item
      if (!stateId || !lgaId) {
        return acc
      }
      let state = acc.find(x => x.stateId === stateId)
      if (!state) {
        id += 1
        state = {
          /**
           * specific props for current nesting level
           */
          stateId,
          /**
           * base props for NestedTable component
           */
          id,
          name: stateName,
          children: [], // list of LGA's
        }
        acc = [...acc, state]
      }
      let lga = state.children.find(x => x.lgaId === lgaId)
      if (!lga) {
        /**
         * sites
         */
        const rawSites = allSites.filter(it => it.stateId === stateId && it.lgaId === lgaId)
        const sites = rawSites.map(({ siteId, siteName }) => {
          /**
           * Devices in this site
           */
          const devicesInSite = rawDevices.filter(x => x.siteId === siteId)
          /**
           * TODO: think and check if it makes sense to show devices
           * under LGA and state level - because some devices may not
           * have siteId defined but have only lgaId or stateId (which
           * is probably may be considered as error))
           */
          // const devicesInLga = rawDevices.filter(x => !x.siteId && x.lgaId === lgaId)
          // const devicesInState = rawDevices.filter(x => !x.siteId && !x.lgaId && x.stateId === stateId)
          const devices = devicesInSite.map(dev => {
            const { deviceId, deviceName } = dev
            const configurationData = dev.configurationData ? JSON.parse(dev.configurationData) : {}
            const { moduleSerials = [], tenColorModules = [] } = configurationData
            const tenColors = moduleSerials.filter(
              moduleSerial => !!tenColorModules.find(it => it.SiteSerialNumber === moduleSerial)
            )
            const cnt6cModules = moduleSerials.length - tenColors.length
            const cnt10cModules = tenColors.length

            id += 1
            const cnt6cDevices = cnt6cModules > 0 ? 1 : 0
            const cnt10cDevices = cnt10cModules > 0 ? 1 : 0
            const cnt6c10cCombo = cnt6cModules > 0 && cnt10cModules > 0 ? 1 : 0
            return {
              /**
               * specific props for current nesting level
               */
              deviceId,
              /**
               * base props for NestedTable component
               */
              id,
              name: deviceName,
              // # Modules
              cnt6cModules,
              cnt10cModules,
              // # Devices - here 1 or 0 for current device
              cnt6cDevices,
              cnt10cDevices,
              cnt6c10cCombo,
              // # Sites
              cntSites: 0,
            }
          })
          /**
           * define Site
           */
          id += 1
          const site = {
            /**
             * specific props for current nesting level
             */
            siteId,
            /**
             * base props for NestedTable component
             */
            id,
            name: siteName,
            children: devices,
            // # Modules
            cnt6cModules: _.sum(devices.map(x => x.cnt6cModules)),
            cnt10cModules: _.sum(devices.map(x => x.cnt10cModules)),
            // # Devices
            cnt6cDevices: _.sum(devices.map(x => x.cnt6cDevices)),
            cnt10cDevices: _.sum(devices.map(x => x.cnt10cDevices)),
            cnt6c10cCombo: _.sum(devices.map(x => x.cnt6c10cCombo)),
            // # Sites
            cntSites: 1,
          }
          return site
        })
        /**
         * LGA
         */
        id += 1
        lga = {
          /**
           * specific props for current nesting level
           */
          lgaId,
          /**
           * base props for NestedTable component
           */
          id,
          name: lgaName,
          children: sites,
          // # Modules
          cnt6cModules: _.sum(sites.map(x => x.cnt6cModules)),
          cnt10cModules: _.sum(sites.map(x => x.cnt10cModules)),
          // # Devices
          cnt6cDevices: _.sum(sites.map(x => x.cnt6cDevices)),
          cnt10cDevices: _.sum(sites.map(x => x.cnt10cDevices)),
          cnt6c10cCombo: _.sum(sites.map(x => x.cnt6c10cCombo)),
          // # Sites
          cntSites: _.sum(sites.map(x => x.cntSites)),
        }
        state.children = [...state.children, lga]
      }
      return acc
    },
    []
  )

  /**
   * set counts for all states
   */
  nestedData = nestedData.map(state => {
    return {
      ...state,
      // # Modules
      cnt6cModules: _.sum(state.children.map(x => x.cnt6cModules)),
      cnt10cModules: _.sum(state.children.map(x => x.cnt10cModules)),
      // # Devices
      cnt6cDevices: _.sum(state.children.map(x => x.cnt6cDevices)),
      cnt10cDevices: _.sum(state.children.map(x => x.cnt10cDevices)),
      cnt6c10cCombo: _.sum(state.children.map(x => x.cnt6c10cCombo)),
      // # Sites
      cntSites: _.sum(state.children.map(x => x.cntSites)),
    }
  })
  const data = nestedData

  return {
    ok: true,
    total: data.length,
    length: data.length,
    data,
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
  getDoNotUseModulesReport,
  getModuleStatusReport,
  getDevicesWithCountsForTBReport,
  getAllDeviceReport,
  getErrorRateByDeviceReport,
  getErrorRateByModuleReport,
  getErrorRateByUserReport,
  getErrorsByDevicesReport,
  noStockInventoryReport,
  getDeviceCoverageReport,
}
