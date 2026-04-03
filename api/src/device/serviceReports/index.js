const _ = require('lodash')
const { format, parseISO, subMonths } = require('date-fns')
const Boom = require('@hapi/boom')
const { getDeviceBaseExtendedQuery } = require('../service')
const { exportData } = require('../../shared/excel')
const { knex, filterDateRangeParams, filterParams, sortPageParams } = require('../../db')
const { getConstraints, addConstraints } = require('../../auth/constraints')
const { getDateTimeProjectionInTimeZoneIANA } = require('../../shared/date')
const { getPersonByPersonId } = require('../../auth/service')
const { getModuleActivityReportData } = require('./moduleActivityReport')
const { getDoNotUseModulesReportData } = require('./doNotUseModulesReport')
const { getDevicesWithCountsForTB } = require('./genXpertTbWorkloadReport')
const { getAllDeviceReportData } = require('./deviceAndSiteSummaryReport')
const { getResultCategoryGroupColumns, getUnusedModulesReportData } = require('../common/db')
const { getErrorsByDevices } = require('./getErrorsByDevices')
const { getErrorRateByDevice, getErrorRateByModule, getErrorRateByUser } = require('./errorRatesReport')
const { getNoStockInventoryReport } = require('./noStockInventoryReport')
const { getModuleSwapsReportData } = require('./moduleSwapsReport')
const { INTERNAL_DEVICE_IDS } = require('../../shared/constants')
const { getBaseQueryForFactResultsDeviceByTimeFrame } = require('../../fact/common/db')
const { getDevicesByTBReach } = require('./deviceReport')
const { assayToId } = require('../../shared/dictionary')
const { getWorkingDays } = require('../../shared/date')
const { getMonthsDatefields } = require('./logic')
const { getPartnerWorkingDaysConfig } = require('../../partner/common/db')

async function getDeviceActivityReport(auth, query, timezoneIANA) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { culture } = await getPersonByPersonId(auth.credentials.personId)
  const deviceQuery = getDeviceBaseExtendedQuery(query, dataConstraints, { extendJoinToAssays: true }).whereNotIn(
    'dt.externalId',
    ['Aspect', 'GxAlert']
  )
  const extraField = query.select ? query.select.split(' as ')[1].trim() : null

  const { minDate = subMonths(new Date(), 12), maxDate = new Date() } = query
  const addingGroupingAndSelect = (builder, { select, groupBy }) => {
    if (extraField) {
      if (select) builder.select(select)
      if (groupBy) builder.groupBy(groupBy)
    }
  }

  const baseFactItems = getBaseQueryForFactResultsDeviceByTimeFrame(knex, {
    addConstraints,
    dataConstraints,
    filterParams,
    query,
    timeFrame: 'day',
  })
    .select('r.deviceId')
    .groupBy('r.deviceId')
    .sum({
      totalResults: 'r.resultCount',
    })
    .modify(addingGroupingAndSelect, query)

  const baseFactByMonth = getBaseQueryForFactResultsDeviceByTimeFrame(knex, {
    addConstraints,
    dataConstraints,
    filterParams,
    query,
    timeFrame: 'day',
  })
    .select('r.deviceId', knex.raw("DATE_FORMAT(r.startedOn,'%Y-%m') as monthYear"))
    .sum({
      totalResults: 'r.resultCount',
    })
    .groupBy('r.deviceId', 'monthYear')
    .modify(addingGroupingAndSelect, query)

  const baseResultsLastUploaded = knex('Result as r')
    .modify(addConstraints, dataConstraints, {
      result: 'r',
    })
    .groupBy('r.deviceId')
    .select('r.deviceId', getDateTimeProjectionInTimeZoneIANA(knex, 'MAX(r.updatedOn)', timezoneIANA, 'lastUploadOn'))

  const devicesData = await deviceQuery
    .clone()
    .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.id')
    .leftJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
    .leftJoin(baseFactItems.as('fact'), 'd.id', 'fact.deviceId')
    .leftJoin(baseResultsLastUploaded.as('res'), 'd.id', 'res.deviceId')
    .distinct(
      'd.id',
      'd.name',
      'd.serial',
      'da.name as deviceApprovalStatus',
      'dms.name as deviceMaintenanceStatus',
      'res.lastUploadOn',
      'fact.totalResults'
    )
    .modify(qb => {
      if (extraField) {
        qb.distinct('fact.assayName')
      }
    })
    .modify(sortPageParams, query, 'name')

  const deviceResultsPerMonths = await deviceQuery
    .clone()
    .leftJoin(baseFactByMonth.as('fact'), 'd.id', 'fact.deviceId')
    .select('d.id as deviceId', 'fact.totalResults', 'fact.monthYear')
    .modify(qb => {
      if (extraField) {
        qb.select('fact.assayName')
      }
    })

  const dateFields = getMonthsDatefields(minDate, maxDate, culture)

  const devices = _.map(devicesData, elem => {
    _.each(
      _.filter(
        deviceResultsPerMonths,
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

async function getGeneXpertIssuesReport(auth, query, timezoneIANA) {
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
      deviceApprovalExternalId: 'da.token',
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
    .select(getDateTimeProjectionInTimeZoneIANA(knex, 'i.createdOn', timezoneIANA, 'triggeredOn'))
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
    .join('Geography as g', 's.geographyId', 'g.id')
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

async function getModuleActivityReport(auth, query, timezone) {
  const dataConstraints = await getConstraints(auth.credentials)
  const rows = await getModuleActivityReportData(dataConstraints, query, timezone)

  return {
    ok: true,
    data: rows,
    total: rows.length,
  }
}

async function getDoNotUseModulesReport(auth, query, timezone) {
  const dataConstraints = await getConstraints(auth.credentials)
  const rows = await getDoNotUseModulesReportData(dataConstraints, query, timezone)

  return {
    ok: true,
    data: rows,
    total: rows.length,
    replacements: [
      {
        placeholder: '<countOfDistinctDisabledModules>',
        value: [...new Set(rows.map(row => row.moduleSerial))].length,
      },
    ],
  }
}

async function getModuleStatusReport(auth, query) {
  let { minDate = subMonths(new Date(), 1), maxDate = new Date() } = query
  if (typeof minDate === 'string' || minDate instanceof String) {
    minDate = new Date(minDate)
  }
  if (typeof maxDate === 'string' || maxDate instanceof String) {
    maxDate = new Date(maxDate)
  }

  minDate = new Date(minDate.toDateString())
  maxDate = new Date(maxDate.toDateString())
  const dataConstraints = await getConstraints(auth.credentials)

  const rows = await knex('Device as d')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Partner as p', 'p.id', 'd.partnerId')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('State as state', 'state.id', 'g.stateId')
    .innerJoin('Lga as lga', 'lga.id', 'g.lgaId')
    .whereNot('dt.externalId', 'GxAlert')
    .select([
      'd.id as deviceId',
      'd.name as deviceName',
      'd.serial as deviceSerial',
      'd.moduleBayCapacity as moduleBayCapacity',
      'state.name as State',
      'lga.name as Lga',
    ])
    .groupBy('d.id')
    .orderBy(['d.name'])
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
      partner: 'p',
    })
    .modify(filterParams, query, {
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })

  const disabledModules = await knex('Issue as i')
    .join('IssueType as it', 'i.issueTypeId', 'it.id')
    .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .join('Device as d', 'i.deviceId', 'd.id')
    .whereNotNull('i.deviceId')
    .where('it.externalId', 'ModuleDisabled')
    .where('is.externalId', 'Active')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
    })
    .groupBy('i.deviceId')
    .select('i.deviceId', knex.raw('COUNT(DISTINCT i.data->>"$.moduleSerial") as count'))

  const moduleUsage = await knex('FactDeviceModulesCount as m')
    .innerJoin('Device as d', 'm.deviceId', 'd.id')
    .where('m.date', '>=', minDate)
    .where('m.date', '<', maxDate)
    .modify(addConstraints, dataConstraints, {
      device: 'd',
    })
    .groupBy('m.deviceId')
    .select([
      'm.deviceId as deviceId',
      knex.raw('MAX(m.moduleBaysUsed) as moduleBaysUsed'),
      knex.raw('MAX(m.modulesUsed) as modulesUsed'),
    ])

  _.each(rows, row => {
    const activeModules = moduleUsage.find(d => d.deviceId === row.deviceId)?.modulesUsed || 0

    row.activeModuleBays = moduleUsage.find(d => d.deviceId === row.deviceId)?.moduleBaysUsed || 0
    row.replacedModules = activeModules > row.moduleBayCapacity ? activeModules - row.moduleBayCapacity : 0
    row.disabledModules = disabledModules.find(d => d.deviceId === row.deviceId)?.count || 0
  })

  return {
    ok: true,
    data: rows,
    total: rows.length,
  }
}

async function getDevicesWithCountsForTBReport(auth, query, timezoneIANA) {
  const dataConstraints = await getConstraints(auth.credentials)
  const rows = await getDevicesWithCountsForTB(dataConstraints, query, timezoneIANA)

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

async function getAllDeviceReport(auth, query, timezone) {
  const dataConstraints = await getConstraints(auth.credentials)
  const resultCategoryGroups = await getResultCategoryGroupColumns(dataConstraints, query)
  const { builder } = await getAllDeviceReportData(resultCategoryGroups, dataConstraints, query, timezone)
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
  const { minDate, maxDate } = query
  if (!minDate || !maxDate) {
    throw Boom.badRequest('Dates are required')
  }
  const dataConstraints = await getConstraints(auth.credentials)
  const data = await getErrorsByDevices(dataConstraints, query)
  return {
    ok: true,
    total: data.length,
    length: data.length,
    data,
  }
}

async function getDevicesForTBReachReport(auth, query) {
  const { minDate, maxDate, assayId } = query
  if (!minDate || !maxDate) {
    throw Boom.badRequest('Dates are required')
  }
  const dataConstraints = await getConstraints(auth.credentials)
  const assayExternlId = ['GxMtbRif', 'GxMtbRifUltra']
  const assayIds = await Promise.all(assayExternlId.map(async externalId => assayToId(externalId)))
  query.assayIds = assayId ?? assayIds
  query.noResults = true
  const [devicesByTBReach, errorsResult] = await Promise.all([
    getDevicesByTBReach(dataConstraints, query),
    getErrorsByDevices(dataConstraints, query),
  ])
  const customWorkingDaysConfig = await getPartnerWorkingDaysConfig(auth)
  const devicesByTBReachData = new Map(devicesByTBReach.map(device => [device.deviceId, device]))
  const workingDays = getWorkingDays(new Date(minDate), new Date(maxDate), customWorkingDaysConfig)
  // Merge data from both queries
  let mergedData = errorsResult.map(error => {
    const TBReachDevice = devicesByTBReachData.get(error.deviceId)
    return {
      ...error,
      totalXpertTests: TBReachDevice?.totalXpertTests ?? 0,
      xpertPositive: TBReachDevice?.xpertPositive ?? 0,
      xpertNegative: TBReachDevice?.xpertNegative ?? 0,
      xpertErrorInvalid: TBReachDevice?.xpertErrorInvalid ?? 0,
      xpertRIFPositive: TBReachDevice?.xpertRIFPositive ?? 0,
      xpertRIFIndeterminate: TBReachDevice?.xpertRIFIndeterminate ?? 0,
      xpertPlusTreated: 'n/d',
      xpertPerDay: TBReachDevice ? TBReachDevice.totalXpertTests / workingDays : 0,
    }
  })
  mergedData = assayId && !assayIds.includes(assayId) ? [] : mergedData
  return {
    ok: true,
    total: mergedData.length,
    length: mergedData.length,
    data: mergedData,
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
      'd.gx6cModulesCount as cnt6cModules',
      'd.gx10cModulesCount as cnt10cModules',
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
            /**
             * We used bellow commented code to get number of 6c/10c modules from Device.configurationData props
             * See - https://systemone.youtrack.cloud/issue/HD-15418/Bangladesh-Dashboard-GeneXpert-Device-Coverage-data-need-to-rechecknot-showing-correct-data#focus=Comments-4-66139.0-0
             *
             // const configurationData = dev.configurationData ? JSON.parse(dev.configurationData) : {}
             // const { moduleSerials = [], tenColorModules = [] } = configurationData
             // const tenColors = moduleSerials.filter(
             //   moduleSerial => !!tenColorModules.find(it => it.SiteSerialNumber === moduleSerial)
             // )
             // const cnt6cModules = moduleSerials.length - tenColors.length
             // const cnt10cModules = tenColors.length
             *
             * And to show correct values in `GeneXpert Device Coverage` nesting tables - we changed that and started using
             * of Device.gx6cModulesCount and Device.gx10cModulesCount fields directly
             * See - https://systemone.youtrack.cloud/issue/HD-15418/Bangladesh-Dashboard-GeneXpert-Device-Coverage-data-need-to-rechecknot-showing-correct-data#focus=Comments-4-66141.0-0
             *
             */
            let { cnt6cModules, cnt10cModules } = dev
            cnt6cModules = cnt6cModules ?? 0
            cnt10cModules = cnt10cModules ?? 0

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

async function getUnusedModulesReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const unusedModules = await getUnusedModulesReportData(dataConstraints, query)

  const rows = unusedModules.filter(elem => elem.modulesAvailable > elem.modulesReporting)

  return {
    ok: true,
    data: rows,
    total: rows.length,
  }
}

module.exports = {
  getDeviceActivityReport,
  getModuleSwapsReport,
  getGeneXpertIssuesReport,
  getGeneXpertOperationLogsReport,
  exportDeviceOperationLogReport,
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
  getDevicesForTBReachReport,
  getUnusedModulesReport,
}
