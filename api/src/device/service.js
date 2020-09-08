const _ = require('lodash')
const Boom = require('@hapi/boom')
const Promise = require('bluebird')
const {
  addDays,
  startOfToday,
  startOfDay,
  subMonths,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  format,
  isWeekend,
  parseISO,
} = require('date-fns')

const { deviceMaintenanceStatusLogged } = require('./actions')
const {
  knex,
  filterParams,
  filterDateRangeParams,
  sortPageParams,
} = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getUser } = require('../auth/service')
const {
  allResultCategoryToId,
  deviceApprovalToId,
  resultCategoryToId,
  deviceMaintenanceTypeToId,
} = require('../shared/dictionary')
const { parseDateOrDefault, getLocalDateInUtc } = require('../shared/date')

const SELECT_LIST_FIELDS = [
  'd.id',
  'd.name',
  'd.shortName',
  'd.createdOn',
  'd.lastPingOn',
  'd.lastSeenOn as lastSeen',
  'st.name as state',
  'dt.name as type',
  's.name as siteName',
  'da.name as approval',
  'dms.externalId as maintenanceStatus',
  'dms.i18nKey as maintenanceStatusI18nKey',
  'dms.name as maintenanceStatusName',
  'dms.active as maintenanceStatusActive',
  'dms.manuallySet as maintenanceStatusManuallySet',
  'dc.name as category',
  'dc.hasResults',
  'dc.hasConnectivity',
]

const SELECT_SHOW_FIELDS = [
  'd.id',
  'd.name',
  'd.shortName',
  'd.createdOn',
  'd.lastPingOn',
  'd.lastSeenOn as lastSeen',
  'da.name as approval',
  'dms.externalId as maintenanceStatus',
  'dms.i18nKey as maintenanceStatusI18nKey',
  'dms.name as maintenanceStatusName',
  'dms.active as maintenanceStatusActive',
  'dms.manuallySet as maintenanceStatusManuallySet',
  'da.token as approvalToken',
  'dc.name as category',
  'dc.hasResults',
  'dc.hasConnectivity',
  'd.siteId',
  's.name as siteName',
  'd.hostId',
  'd.deviceTypeId',
  'd.deviceApprovalId',
  'd.configurationData',
  'd.notes',
  'd.serial',
  'dt.id as deviceTypeId',
  'dt.name as deviceTypeName',
  'dt.externalId as deviceTypeExternalId',
  'dt.configurationDataSchema',
  'dt.deviceOperationSchema',
  'dp.dailyCapacity',
  'frd30.resultCount as resultCountThisMonth',
  'frd60.resultCount as resultCount60',
  knex.raw('ifnull(frd30Errors.resultCount, 0) as errorCountThisMonth'),
  knex.raw('ifnull(frd60Errors.resultCount, 0) as errorCount60'),
  knex.raw("dmsl.data->>'$.options.data.notes' as maintenanceStatusNotes"),
  'dmC.contextDate as calibrationDate',
  'dmC.notes as calibrationNotes',
  'dmW.contextDate as warrantyDueDate',
  'dmW.notes as warrantyNotes',
]

// ---------------------------------
// basic method for reading dataset of devices
// ---------------------------------
async function getListDevices(query, auth) {
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultCategoryErrorId = await resultCategoryToId('Error')

  const deviceQuery = knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('FactResultsDevice as frd30', function () {
      this.on('d.id', 'frd30.deviceId').andOn('frd30.days', 30)
    })
    .leftJoin('FactResultsDevice as frd60', function () {
      this.on('d.id', 'frd60.deviceId').andOn('frd60.days', 60)
    })
    .leftJoin('FactResultsDeviceByCategory1 as frd30Errors', function () {
      this.on('d.id', 'frd30Errors.deviceId')
        .andOn('frd30Errors.days', 30)
        .andOn('frd30Errors.resultCategory1', resultCategoryErrorId)
    })
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Assay as a', 'dt.id', 'a.deviceTypeId')
    .leftJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .leftJoin('Disease as dis', 'at.diseaseId', 'dis.id')
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
    .where(queryBuilder => {
      if (query.deviceIds) {
        queryBuilder.whereIn('d.id', query.deviceIds.split(','))
      }
      if (
        query.deviceMaintenanceStatusId &&
        !_.isEmpty(query.deviceMaintenanceStatusId)
      ) {
        queryBuilder.whereIn(
          'dmsl.deviceMaintenanceStatusId',
          query.deviceMaintenanceStatusId
        )
      }
    })
    .modify(queryBuilder => {
      if (query.resultCategoryId)
        queryBuilder
          .innerJoin('ResultCategoryAssay as rca', 'a.id', 'rca.assayId')
          .where('rca.resultCategoryId', query.resultCategoryId)
    })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      deviceName: 'd.name',
      deviceApprovalId: 'd.deviceApprovalId',
      deviceTypeId: 'd.deviceTypeId',
      hasConnectivity: 'dc.hasConnectivity',
      hasResults: 'dc.hasResults',
      category: 'dc.name',
      type: 'dt.name',
      siteExternalId: 's.externalId',
      siteName: 's.name',
      siteId: 's.id',
      diseaseId: 'dis.id',
      assayId: 'a.id',
    })
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      device: 'd',
      deviceType: 'dt',
      geography: 'g',
      site: 's',
      disease: 'dis',
    })
  // get total count for paging
  const getCount = deviceQuery.clone().countDistinct('d.id as count').first()

  // get rows
  const getItems = deviceQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select([
      ...SELECT_LIST_FIELDS,
      'frd30.resultCount as resultCountThisMonth',
      knex.raw('frd60.resultCount - frd30.resultCount as resultCountLastMonth'),
      'frd30Errors.resultCount as thisMonthErrors',
      knex.raw(
        'IFNULL(frd60.resultsDeliveredCount, 0) - IFNULL(frd30.resultsDeliveredCount, 0) as deliveredLastMonth'
      ),
      knex.raw('IFNULL(frd30.resultsDeliveredCount, 0) as deliveredThisMonth'),
      // get csv of issue types
      knex('Issue as i1')
        .leftOuterJoin('IssueType as it', 'i1.issueTypeId', 'it.id')
        .leftOuterJoin('IssueStatus as ist', 'i1.issueStatusId', 'ist.id')
        .leftOuterJoin('IssueCategory as ic', 'it.issueCategoryId', 'ic.id')
        .whereRaw('i1.deviceId = d.id')
        // skip IssueStatus 'Inactive', 'OK' or 'Resolved'
        .whereNotIn('ist.externalId', ['Inactive', 'OK', 'Resolved'])
        .select(knex.raw(`GROUP_CONCAT(DISTINCT ic.i18nKey)`))
        .as('issueCategories'),
    ])
    .distinct()

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  data.forEach(it => {
    // FIXME: Use actual data instead
    const availabilityCount = _.random(25, 30)
    it.availability = {
      count: availabilityCount,
      total: 30,
      rate: availabilityCount / 30,
    }

    it.error = {
      count: it.thisMonthErrors || 0,
      total: it.resultCountThisMonth || 0,
      rate: it.resultCountThisMonth
        ? it.thisMonthErrors / it.resultCountThisMonth
        : 0,
    }
    delete it.thisMonthErrors

    it.issueCategories = it.issueCategories
      ? it.issueCategories.split(',').map(key => ({ key }))
      : []
  })

  const result = { ok: true, total, length: data.length, data }

  return result
}

// ---------------------------------
// reading dataset for Devices grid
// ---------------------------------
async function listDevices(request) {
  const { query, auth } = request
  // get dataset for current query params (sorting, filtering and pagination) and auth constraints

  const result = await getListDevices(query, auth)

  return result
}

async function getDeviceByDeviceId({
  deviceId,
  credentials,
  fields = SELECT_SHOW_FIELDS,
}) {
  const dataConstraints = await getConstraints(credentials)

  const maintenanceCalibrationId = await deviceMaintenanceTypeToId(
    'calibration'
  )
  const maintenanceWarrantyId = await deviceMaintenanceTypeToId('warranty')

  const resultCategoryErrorId = await resultCategoryToId('Error')

  const device = await knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('DeviceCapacity as dp', 'd.deviceCapacityId', 'dp.id')
    .leftJoin('FactResultsDevice as frd30', function () {
      this.on('d.id', 'frd30.deviceId').andOn('frd30.days', 30)
    })
    .leftJoin('FactResultsDevice as frd60', function () {
      this.on('d.id', 'frd60.deviceId').andOn('frd60.days', 60)
    })
    .leftJoin('FactResultsDeviceByCategory1 as frd30Errors', function () {
      this.on('d.id', 'frd30Errors.deviceId')
        .andOn('frd30Errors.days', 30)
        .andOn('frd30Errors.resultCategory1', resultCategoryErrorId)
    })
    .leftJoin('FactResultsDeviceByCategory1 as frd60Errors', function () {
      this.on('d.id', 'frd60Errors.deviceId')
        .andOn('frd60Errors.days', 60)
        .andOn('frd60Errors.resultCategory1', resultCategoryErrorId)
    })
    // device calibration
    .leftOuterJoin('DeviceMaintenance as dmC', function () {
      this.on('d.id', 'dmC.deviceId')
        .andOn('dmC.current', 1)
        .andOn('dmC.deviceMaintenanceTypeId', maintenanceCalibrationId)
    })
    // device warranty
    .leftOuterJoin('DeviceMaintenance as dmW', function () {
      this.on('d.id', 'dmW.deviceId')
        .andOn('dmW.current', 1)
        .andOn('dmW.deviceMaintenanceTypeId', maintenanceWarrantyId)
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
    .where('d.id', +deviceId)
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      deviceType: 'dt',
      site: 's',
      showUnapprovedDevices: true,
    })
    .first(fields)

  if (!device) {
    return null
  }

  device.configurationData = JSON.parse(device.configurationData) || {}
  device.deviceType = {
    id: device.deviceTypeId,
    name: device.deviceTypeName,
    externalId: device.deviceTypeExternalId,
    configurationDataSchema: JSON.parse(device.configurationDataSchema) || {},
    deviceOperationSchema: JSON.parse(device.deviceOperationSchema) || {},
  }
  delete device.deviceTypeId
  delete device.deviceTypeName
  delete device.deviceTypeExternalId
  delete device.configurationDataSchema
  delete device.deviceOperationSchema

  device.resultCountLastMonth =
    device.resultCount60 - device.resultCountThisMonth
  device.errorCountLastMonth = device.errorCount60 - device.errorCountThisMonth

  device.utilizationRateThisMonth = device.dailyCapacity
    ? device.resultCountThisMonth / (device.dailyCapacity * 30)
    : null

  device.errorRateThisMonth = device.resultCountThisMonth
    ? device.errorCountThisMonth / device.resultCountThisMonth
    : null

  return device
}

async function getDeviceByRequest(request, fields = SELECT_SHOW_FIELDS) {
  const {
    auth: { credentials },
    params: { deviceId },
  } = request

  return getDeviceByDeviceId({
    deviceId,
    credentials,
    fields,
  })
}

async function showDevice(request) {
  const device = await getDeviceByRequest(request)

  if (!device) {
    return Boom.notFound()
  }

  const result = {
    ok: true,
    data: device,
  }

  return result
}

async function updateDevice(request) {
  const { params, payload } = request

  // TODO: check permission

  const device = await getDeviceByRequest(request)

  const configurationData = _.assign(
    {},
    device.configurationData,
    payload.configurationData
  )

  let { deviceApprovalId } = device
  // check if a approvalToken is provided
  if (
    _.has(payload, 'approvalToken') &&
    device.approvalToken !== payload.approvalToken
  ) {
    deviceApprovalId = await deviceApprovalToId(payload.approvalToken)
  }

  // update item
  const updatedCount = await knex('Device')
    .where('id', params.deviceId)
    .update({
      siteId: payload.siteId || device.siteId,
      deviceApprovalId,
      configurationData: JSON.stringify(configurationData),
    })

  if (updatedCount !== 1) {
    return Boom.badRequest()
  }

  const result = await showDevice(request)
  return result
}

async function listApprovalTypes() {
  const resultQuery = knex('DeviceApproval as da')

  // get total count for paging
  const getCount = resultQuery.clone().count('da.id as count').first()

  // get rows
  const getItems = resultQuery.clone().orderBy('id', 'asc').select('id', 'name')

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function listMaintenanceStatuses() {
  const resultQuery = knex('DeviceMaintenanceStatus as dms')

  // get total count for paging
  const getCount = resultQuery.clone().count('dms.id as count').first()

  // get rows
  const getItems = resultQuery.clone().orderBy('id', 'asc').select()

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function listDevicesForSelectList(request) {
  const { query, auth } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const devices = await knex('Device as d')
    .leftOuterJoin('Geography as g', 'd.geographyId', 'g.id')
    .modify(addConstraints, dataConstraints, { device: 'd', geography: 'g' })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      partnerId: 'd.partnerId',
      siteId: 'd.siteId',
    })
    .orderBy(['d.name'], 'asc')
    .select('d.id', 'd.name')

  return { ok: true, data: devices }
}

async function getDevice(deviceId) {
  const device = await knex('Device as d').where('d.id', deviceId).first()
  return device
}

async function updateDeviceMaintenance(request) {
  const {
    auth: { credentials },
    params,
    payload,
  } = request
  const dataConstraints = await getConstraints(credentials)

  let device = await knex('Device as d')
    .where('d.id', +params.deviceId)
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .first('d.id')

  if (!device) {
    return Boom.notFound()
  }
  const { id: deviceId } = device

  const currentlyLoggedInUser = await getUser(credentials.name)

  const { externalId, contextDate = new Date(), notes } = payload
  const { id: deviceMaintenanceTypeId } = await knex('DeviceMaintenanceType')
    .where({ externalId })
    .first('id')

  // get currently active maintenance item
  const item = await knex('DeviceMaintenance')
    .where({
      deviceId,
      deviceMaintenanceTypeId,
      current: 1,
    })
    .first()
  let deviceMaintenanceId
  if (item && item.contextDate.toDateString() === contextDate.toDateString()) {
    // update existing record if dates are the same
    await knex('DeviceMaintenance').where({ id: item.id }).update({
      contextDate,
      notes,
      updatedOn: new Date(),
      updatedBy: currentlyLoggedInUser.id,
    })
    deviceMaintenanceId = item.id
  } else {
    // reset 'current' for current maintenance type and device
    await knex('DeviceMaintenance').update({ current: 0 }).where({
      deviceId,
      deviceMaintenanceTypeId,
      current: 1,
    })
    // insert new record with last maintenance status
    ;[deviceMaintenanceId] = await knex('DeviceMaintenance').insert({
      deviceId,
      deviceMaintenanceTypeId,
      current: 1,
      contextDate,
      notes,
      createdOn: new Date(),
      createdBy: currentlyLoggedInUser.id,
      updatedOn: new Date(),
      updatedBy: currentlyLoggedInUser.id,
    })
  }
  // get same 'device' as for Device Details
  device = await getDeviceByDeviceId({
    deviceId,
    credentials,
  })

  return { ok: true, data: device, deviceMaintenanceId }
}

async function getDevicePerformance(request) {
  const { auth, params } = request

  const { deviceId } = params

  const dataConstraints = await getConstraints(auth.credentials)

  const endedOn = new Date()

  const startedOn = startOfMonth(subMonths(endedOn, 12)) // 12 months period

  const devicePerformance = await knex('Result as r')
    .leftJoin('ResultCategory as rc1', 'rc1.id', 'r.resultCategory1')
    .leftJoin('ResultCategory as rc2', 'rc2.id', 'r.resultCategory2')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .modify(addConstraints, dataConstraints, { result: 'r', device: 'd' })
    .where('r.deviceId', deviceId)
    .where('r.endedOn', '>=', startedOn)
    .where('r.endedOn', '<=', endedOn)
    .select([
      knex.raw('count(r.id) as totalResult'), // group by r.endedOn as 'yyyy-MM'
      knex.raw(`sum(rc1.name = 'Error') as errorCount`),
      knex.raw(`date_format(r.endedOn, '%Y-%m') AS monthTested`),
    ])
    .groupBy('monthTested')

  const [deviceCountry] = await knex('Device as d')
    .leftOuterJoin('Geography as g', 'd.geographyId', 'g.id')
    .leftOuterJoin('Country as c', 'g.countryId', 'c.id')
    .modify(addConstraints, dataConstraints, { geography: 'g' })
    .where('d.id', deviceId)

  const [{ countryTotalResult, countryTotalErrorCount }] = await knex(
    'Result as r'
  )
    .leftJoin('ResultCategory as rc1', 'rc1.id', 'r.resultCategory1')
    .leftJoin('ResultCategory as rc2', 'rc2.id', 'r.resultCategory2')
    .leftOuterJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftOuterJoin('Country as c', 'g.countryId', 'c.id')
    .modify(addConstraints, dataConstraints, { result: 'r', geography: 'g' })
    .where('r.endedOn', '>=', startedOn)
    .where('r.endedOn', '<=', endedOn)
    .where('c.id', deviceCountry.countryId)
    .select([
      knex.raw('count(r.id) as countryTotalResult'),
      knex.raw(`sum(rc1.name = 'Error') as countryTotalErrorCount`),
    ])

  const [deviceCapacity] = await knex('DeviceCapacity as dc')
    .leftJoin('Device as d', 'd.deviceCapacityId', 'dc.id')
    .where('d.id', deviceId)
    .select('dc.dailyCapacity')

  let dt = endedOn

  while (dt >= startedOn) {
    const monthTested = format(dt, 'yyyy-MM')

    if (!devicePerformance.find(x => x.monthTested === monthTested)) {
      devicePerformance.push({
        errorCount: 0,
        totalResult: 0,
        monthTested,
      })
    }

    dt = endOfMonth(subMonths(dt, 1))
  }

  let utilizationRateAvg = null
  const newData = _.map(devicePerformance, x => {
    if (deviceCapacity) {
      utilizationRateAvg = 80

      x.utilizationRate = Math.round(
        (x.totalResult * 100) /
          (getDaysInMonth(new Date(x.monthTested)) *
            deviceCapacity.dailyCapacity)
      )
    } else {
      x.utilizationRate = null
    }

    if (x.totalResult) {
      x.errorRate = Math.round((x.errorCount * 100) / x.totalResult)
      return x
    }
    x.errorRate = 0
    return x
  })

  return {
    ok: true,
    length: newData.length,
    utilizationRateAvg,
    errorRateAvg: Math.round(
      (countryTotalErrorCount * 100) / countryTotalResult
    ),
    data: _.sortBy(newData, [x => x.monthTested]),
  }
}

function getDeviceBaseQuery(query, dataConstraints) {
  const deviceQuery = knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.stateId', 'lg.id')
    .where(function () {
      if (!query.deviceIds) {
        return
      }
      this.whereIn('d.id', query.deviceIds.split(','))
    })
    .modify(queryBuilder => {
      if (!query.assayId) {
        return
      }
      queryBuilder
        .innerJoin('Assay as a', 'dt.id', 'a.deviceTypeId')
        .where('a.id', query.assayId)

      if (!query.resultCategoryId) {
        return
      }
      queryBuilder
        .innerJoin('ResultCategoryAssay as rca', 'a.id', 'rca.assayId')
        .where('rca.resultCategoryId', query.resultCategoryId)

      if (!query.resultCategory2Id) {
        return
      }
      queryBuilder
        .innerJoin('ResultCategoryAssay as rca2', 'a.id', 'rca2.assayId')
        .where('rca2.resultCategoryId', query.resultCategory2Id)
    })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      deviceName: 'd.name',
      deviceApprovalId: 'd.deviceApprovalId',
      deviceTypeId: 'd.deviceTypeId',
      hasConnectivity: 'dc.hasConnectivity',
      hasResults: 'dc.hasResults',
      category: 'dc.name',
      type: 'dt.name',
      siteExternalId: 's.externalId',
      siteName: 's.name',
    })
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      device: 'd',
      deviceType: 'dt',
      geography: 'g',
      site: 's',
    })
  return deviceQuery
}

// ---------------------------------
// get devices with different aggregations for reports
// ---------------------------------
async function getDevicesForReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const resultCategoryIds = await allResultCategoryToId()
  const deviceQuery = getDeviceBaseQuery(query, dataConstraints)

  // get total count for paging
  const getCount = deviceQuery.clone().count('d.id as count').first()

  const queryResults = knex('Result as r')
    .innerJoin('Sample as s', 'r.sampleId', 's.id')
    .modify(addConstraints, dataConstraints, {
      result: 'r',
      sample: 's',
    })
    .whereRaw('s.originSiteId = d.siteId')
    .modify(filterDateRangeParams, query, 'r.endedOn')

  // get rows
  const getItems = deviceQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select([
      ...SELECT_LIST_FIELDS,
      'd.serial',
      queryResults.clone().countDistinct('r.id').as('totalResults'),
      queryResults
        .clone()
        .where('r.resultCategory1', resultCategoryIds.Error)
        .countDistinct('r.id')
        .as('totalErrors'),
      queryResults
        .clone()
        .where('r.resultCategory1', resultCategoryIds.Invalid)
        .countDistinct('r.id')
        .as('totalInvalid'),
      queryResults
        .clone()
        .innerJoin(
          'ResultWorkflowLog as rl',
          'r.resultWorkflowStatusLogId',
          'rl.id'
        )
        .max('rl.changedOn')
        .as('lastUploadOn'),
    ])

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  // add more fields which depend on aggregations
  data.forEach(async it => {
    const errorPercentage = Math.round(
      100 * (it.totalResults ? it.totalErrors / it.totalResults : 0)
    )
    it.errorRate = errorPercentage / 100
  })

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function getDevicesForRifResistanceReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const resultCategoryIds = await allResultCategoryToId()
  const deviceQuery = getDeviceBaseQuery(query, dataConstraints)

  // get total count for paging
  const getCount = deviceQuery.clone().count('d.id as count').first()

  const queryResults = knex('Result as r')
    .innerJoin('Sample as s', 'r.sampleId', 's.id')
    .modify(addConstraints, dataConstraints, {
      result: 'r',
      sample: 's',
    })
    .whereRaw('s.originSiteId = d.siteId')
    .modify(filterDateRangeParams, query, 'r.endedOn')

  // get rows
  const getItems = deviceQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select([
      'st.name as state',
      'd.name',
      'lg.name as county',
      queryResults.clone().countDistinct('r.id').as('totalResults'),
      queryResults
        .clone()
        .where('r.resultCategory1', resultCategoryIds.Detected)
        .countDistinct('r.id')
        .as('totalDetected1'),
      queryResults
        .clone()
        .where('r.resultCategory2', resultCategoryIds.Detected)
        .countDistinct('r.id')
        .as('totalDetected2'),
    ])

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  // add more fields which depend on aggregations
  data.forEach(async it => {
    it.rifResistanceRate = it.totalDetected1
      ? it.totalDetected2 / it.totalDetected1
      : 0
  })

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function setDeviceMaintenanceStatus(
  deviceId,
  userId,
  deviceMaintenanceStatusId,
  dayDate,
  data,
  messageContext
) {
  const [deviceMaintenanceStatusLogId] = await knex(
    'DeviceMaintenanceStatusLog'
  ).insert({
    deviceId,
    deviceMaintenanceStatusId,
    day: dayDate,
    data: _.isString(data) ? data : JSON.stringify(data),
    createdOn: new Date(),
    createdBy: userId,
  })
  const context = messageContext.bindActionCreators({
    deviceMaintenanceStatusLogged,
  })
  context.deviceMaintenanceStatusLogged(deviceMaintenanceStatusLogId)
  return deviceMaintenanceStatusLogId
}

async function manuallySetDeviceMaintenanceStatus(request) {
  const {
    auth: { credentials },
    params,
    payload,
    plugins: { messageContext },
  } = request
  const { externalId, day = startOfToday(), notes } = payload
  const deviceMaintenanceStatus = await knex('DeviceMaintenanceStatus')
    .where({ externalId })
    .first()
  if (!deviceMaintenanceStatus) {
    return Boom.badRequest(`${externalId} is not a known maintenance status`)
  }
  if (!deviceMaintenanceStatus.manuallySet) {
    return Boom.badRequest(
      `Devices cannot be manually set to ${deviceMaintenanceStatus.name}`
    )
  }
  const dataConstraints = await getConstraints(credentials)
  const { id: deviceId } = await knex('Device as d')
    .where('d.id', +params.deviceId)
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      showUnapprovedDevices: true,
    })
    .first('d.id')

  if (!deviceId) {
    return Boom.notFound()
  }
  const currentlyLoggedInUser = await getUser(credentials.name)
  if (notes) {
    _.set(payload, 'options.data.notes', notes)
  }
  const deviceMaintenanceStatusLogId = await setDeviceMaintenanceStatus(
    deviceId,
    currentlyLoggedInUser.id,
    deviceMaintenanceStatus.id,
    startOfDay(day),
    payload,
    messageContext
  )
  return {
    ok: true,
    data: {
      deviceMaintenanceStatusLogId,
      maintenanceStatus: deviceMaintenanceStatus.externalId,
      maintenanceStatusI18nKey: deviceMaintenanceStatus.i18nKey,
      maintenanceStatusName: deviceMaintenanceStatus.name,
      maintenanceStatusActive: deviceMaintenanceStatus.active,
      maintenanceStatusNotes: notes,
      maintenanceStatusManuallySet: deviceMaintenanceStatus.manuallySet,
    },
  }
}

async function automaticallySetDeviceMaintenanceStatus(
  deviceId,
  day,
  deviceMaintenanceStatusExternalId,
  data,
  messageContext
) {
  const dayDate = getLocalDateInUtc(startOfDay(day))
  const latestDeviceMaintenanceStatusForDay =
    (await knex('DeviceMaintenanceStatusLog as dmsl')
      .join(
        'DeviceMaintenanceStatus as dms',
        'dmsl.deviceMaintenanceStatusId',
        'dms.id'
      )
      .where('dmsl.deviceId', deviceId)
      .andWhere('dmsl.day', dayDate)
      .orderByRaw('dmsl.createdOn desc, dmsl.id desc')
      .first('dms.*')) || {}
  if (
    latestDeviceMaintenanceStatusForDay.externalId ===
      deviceMaintenanceStatusExternalId ||
    (!latestDeviceMaintenanceStatusForDay.manuallySet &&
      latestDeviceMaintenanceStatusForDay.active)
  ) {
    // If, in the day, the device was already in an automatically
    //   set active status it can't be automatically overwritten
    return
  }
  const { id: deviceMaintenanceStatusId } = await knex(
    'DeviceMaintenanceStatus'
  )
    .where({ externalId: deviceMaintenanceStatusExternalId })
    .first('id')

  if (!deviceMaintenanceStatusId) {
    return Boom.badRequest(
      `${deviceMaintenanceStatusExternalId} is not a known maintenance status that can be manually set`
    )
  }
  await setDeviceMaintenanceStatus(
    deviceId,
    null,
    deviceMaintenanceStatusId,
    dayDate,
    data,
    messageContext
  )
}

async function onDeviceMaintenanceStatusLogged(
  { deviceMaintenanceStatusLogId },
  { messageContext }
) {
  return messageContext.run(async knex => {
    const { deviceId } = await knex('DeviceMaintenanceStatusLog')
      .where('id', deviceMaintenanceStatusLogId)
      .first('deviceId')
    const {
      latestDeviceMaintenanceStatusLogId,
      currentDeviceMaintenanceStatusLogId,
    } =
      (await knex('DeviceMaintenanceStatusLog as dmsl')
        .join('Device as d', 'dmsl.deviceId', 'd.id')
        .where('dmsl.deviceId', deviceId)
        .orderByRaw('dmsl.day desc, dmsl.createdOn desc, dmsl.id desc')
        .first(
          'dmsl.id as latestDeviceMaintenanceStatusLogId',
          'd.deviceMaintenanceStatusLogId as currentDeviceMaintenanceStatusLogId'
        )) || {}
    if (
      currentDeviceMaintenanceStatusLogId !== latestDeviceMaintenanceStatusLogId
    ) {
      await knex('Device').where('id', deviceId).update({
        deviceMaintenanceStatusLogId: latestDeviceMaintenanceStatusLogId,
        updatedOn: new Date(),
      })
    }
  })
}

async function onResultLogged(action, { messageContext }) {
  const { resultId } = action
  return messageContext.run(async knex => {
    const { deviceId, startedOn, endedOn } =
      (await knex('Result')
        .where('id', resultId)
        .first('deviceId', 'startedOn', 'endedOn')) || {}
    if (deviceId && (endedOn || startedOn)) {
      await automaticallySetDeviceMaintenanceStatus(
        deviceId,
        endedOn || startedOn,
        'active',
        action,
        messageContext
      )
    }
  })
}

async function onDeviceMaintenanceResolved(action, { messageContext }) {
  const { deviceId } = action
  if (deviceId) {
    return automaticallySetDeviceMaintenanceStatus(
      deviceId,
      startOfToday(),
      'reportedActive',
      action,
      messageContext
    )
  }
  return Promise.resolve()
}

async function onDeviceUpdateMaintenanceStatusNoResults(
  action,
  { messageContext }
) {
  const { deviceId, options = {} } = action
  if (deviceId) {
    const daysSinceLastResult = []
    let day = options.lastResultOn
      ? startOfDay(parseDateOrDefault(options.lastResultOn))
      : startOfDay(new Date())
    while (day < new Date()) {
      daysSinceLastResult.push(day)
      day = addDays(day, 1)
    }
    await Promise.each(daysSinceLastResult, day =>
      automaticallySetDeviceMaintenanceStatus(
        deviceId,
        day,
        'inactiveNoResultsReported',
        action,
        messageContext
      )
    )
  }
  return Promise.resolve()
}

async function onDeviceUpdateMaintenanceStatus(action, { messageContext }) {
  const { deviceId, options = {} } = action
  if (deviceId) {
    const maintenanceReasonFromSource = _.get(options, 'data.reason', 'other')
    const aspectMaintenanceReason =
      {
        stock: 'inactiveOutOfInventory',
        connectivity: 'inactiveConnectivity',
        repair: 'inactiveDownForRepair',
        decommissioned: 'inactiveDecommissioned',
      }[maintenanceReasonFromSource] || 'inactiveUnknown'
    return automaticallySetDeviceMaintenanceStatus(
      deviceId,
      startOfToday(),
      aspectMaintenanceReason,
      action,
      messageContext
    )
  }
  return Promise.resolve()
}

async function deviceMaintenanceStatusHistory(request) {
  const { query, auth } = request
  const { minDate, maxDate = new Date() } = query
  const dataConstraints = await getConstraints(auth.credentials)

  const days = []
  let day = minDate || startOfMonth(new Date())
  while (day <= (maxDate || startOfToday())) {
    days.push(day)
    day = addDays(day, 1)
  }
  const queryDeviceIds = query.deviceIds ? query.deviceIds.split(',') : []
  const filterByDeviceIds = await knex('Device as d')
    .leftJoin('DeviceMaintenanceStatusLog as dmsl', queryBuilder => {
      queryBuilder
        .on(
          knex.raw('dmsl.day BETWEEN ? AND ?', [days[0], days[days.length - 1]])
        )
        .andOn('d.id', 'dmsl.deviceId')
    })
    .modify(queryBuilder => {
      if (
        query.deviceMaintenanceStatusId &&
        !_.isEmpty(query.deviceMaintenanceStatusId)
      ) {
        queryBuilder.whereIn(
          'dmsl.deviceMaintenanceStatusId',
          query.deviceMaintenanceStatusId
        )
      }
      if (!_.isEmpty(queryDeviceIds)) {
        queryBuilder.whereIn('d.id', queryDeviceIds)
      }
    })
    .distinct('d.id')
    .pluck('d.id')

  const devices = _.isEmpty(filterByDeviceIds)
    ? []
    : await knex('Device as d')
        .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
        .innerJoin(
          'DeviceTypeCategory as dc',
          'dt.deviceTypeCategoryId',
          'dc.id'
        )
        .innerJoin('Site as s', 'd.siteId', 's.id')
        .leftJoin('Geography as g', 's.geographyId', 'g.id')
        .leftJoin('State as st', 'g.stateId', 'st.id')
        .leftJoin('Assay as a', 'dt.id', 'a.deviceTypeId')
        .leftJoin('AssayType as at', 'a.assayTypeId', 'at.id')
        .leftJoin('Disease as dis', 'at.diseaseId', 'dis.id')
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
        .whereIn('d.id', filterByDeviceIds)
        .andWhere('dc.hasResults', true)
        .modify(filterParams, query, {
          countryId: 'g.countryId',
          stateId: 'g.stateId',
          lgaId: 'g.lgaId',
          deviceName: 'd.name',
          deviceApprovalId: 'd.deviceApprovalId',
          deviceTypeId: 'd.deviceTypeId',
          hasConnectivity: 'dc.hasConnectivity',
          hasResults: 'dc.hasResults',
          category: 'dc.name',
          type: 'dt.name',
          siteExternalId: 's.externalId',
          siteName: 's.name',
          siteId: 's.id',
          diseaseId: 'dis.id',
          assayId: 'a.id',
        })
        .modify(addConstraints, dataConstraints, {
          assay: 'a',
          device: 'd',
          deviceType: 'dt',
          geography: 'g',
          site: 's',
          disease: 'dis',
        })
        .select([
          ...SELECT_LIST_FIELDS,
          knex('Result as r')
            .innerJoin('Sample as s', 'r.sampleId', 's.id')
            .modify(addConstraints, dataConstraints, {
              result: 'r',
              sample: 's',
            })
            .whereRaw('r.deviceId = d.id')
            .modify(queryBuilder => {
              if (minDate) {
                queryBuilder
                  .whereBetween('r.startedOn', [minDate, maxDate])
                  .orWhere(queryBuilder => {
                    queryBuilder.whereBetween('r.endedOn', [minDate, maxDate])
                  })
              }
            })
            .countDistinct('r.id')
            .as('resultCount'),
        ])
        .distinct()
  const latestDeviceMaintenanceStatusLogsPerDay = _.isEmpty(devices)
    ? []
    : await knex
        .from(qb => {
          // Getting the most recently created maintenance status log
          //   for each day in a sub query and calling it mrlpd
          //   (Most Recent Log Per Day)
          qb.from('DeviceMaintenanceStatusLog as inner_dmsl')
            .whereIn('inner_dmsl.deviceId', _.map(devices, 'id'))
            .andWhere(qb => {
              qb.whereBetween('inner_dmsl.day', [
                days[0],
                days[days.length - 1],
              ])
            })
            .groupBy('inner_dmsl.deviceId', 'inner_dmsl.day')
            .select(
              'inner_dmsl.deviceId',
              'inner_dmsl.day',
              knex.raw('MAX(inner_dmsl.createdOn) AS createdOn')
            )
            .as('mrlpd')
        })
        .join('DeviceMaintenanceStatusLog as dmsl', qb => {
          qb.on('mrlpd.deviceId', 'dmsl.deviceId')
            .andOn('mrlpd.day', 'dmsl.day')
            .andOn('mrlpd.createdOn', 'dmsl.createdOn')
        })
        .join(
          'DeviceMaintenanceStatus as dms',
          'dmsl.deviceMaintenanceStatusId',
          'dms.id'
        )
        .orderBy(['dmsl.deviceId', 'dmsl.day'])
        .select('dmsl.deviceId', 'dmsl.day', 'dmsl.data', 'dms.externalId')
  const result = {
    ok: true,
    total: devices.length,
    length: devices.length,
    data: devices.map(device => ({
      ...device,
      days: days.map(day => {
        const deviceMaintenanceStatusLog =
          latestDeviceMaintenanceStatusLogsPerDay.find(
            log =>
              log.deviceId === device.id &&
              format(log.day, 'yyyyMMdd') === format(day, 'yyyyMMdd')
          ) || {}
        const dayStatus = {
          date: day,
          externalId:
            deviceMaintenanceStatusLog.externalId || 'inactiveUnknown',
          isWeekend: isWeekend(day),
          data: {},
        }
        if (deviceMaintenanceStatusLog.data) {
          dayStatus.data = JSON.parse(deviceMaintenanceStatusLog.data)
          dayStatus.notes = _.get(
            deviceMaintenanceStatusLog,
            'data.options.data.notes'
          )
        }
        return dayStatus
      }),
    })),
  }
  return result
}

async function deviceMaintenanceStatus(request) {
  const { auth, params } = request
  const { deviceId } = params
  const dataConstraints = await getConstraints(auth.credentials)

  const currentDeviceMaintenanceStatusLog =
    (await knex('Device as d')
      .join(
        'DeviceMaintenanceStatusLog as dmsl',
        'd.deviceMaintenanceStatusLogId',
        'dmsl.Id'
      )
      .modify(addConstraints, dataConstraints, {
        device: 'd',
        showUnapprovedDevices: true,
      })
      .where('d.id', deviceId)
      .first('dmsl.*')) || {}
  if (currentDeviceMaintenanceStatusLog.data) {
    currentDeviceMaintenanceStatusLog.data = JSON.parse(
      currentDeviceMaintenanceStatusLog.data
    )
    currentDeviceMaintenanceStatusLog.notes = _.get(
      currentDeviceMaintenanceStatusLog,
      'data.options.data.notes',
      null
    )
  }
  return {
    ok: true,
    data: currentDeviceMaintenanceStatusLog,
  }
}

async function onDeviceMaintenanceStatusLogScheduled(
  action,
  { messageContext }
) {
  return messageContext.run(async knex => {
    const today =
      (action.today && parseISO(action.today)) ||
      getLocalDateInUtc(startOfToday())
    const devicesWithNoMaintenanceLogForTheDay = await knex('Device as d')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
      .leftJoin(
        'DeviceMaintenanceStatusLog as current_dmsl',
        'd.deviceMaintenanceStatusLogId',
        'current_dmsl.id'
      )
      .leftJoin(
        'DeviceMaintenanceStatus as current_dms',
        'current_dmsl.deviceMaintenanceStatusId',
        'current_dms.id'
      )
      .leftJoin('DeviceMaintenanceStatusLog as today_dmsl', queryBuilder => {
        queryBuilder
          .on('d.id', 'today_dmsl.deviceId')
          .andOn('today_dmsl.day', knex.raw('?', [today]))
      })
      .leftJoin(
        'DeviceMaintenanceStatus as today_dms',
        'today_dmsl.deviceMaintenanceStatusId',
        'today_dms.id'
      )
      .leftJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
      .where('dtc.hasResults', true)
      .andWhere(queryBuilder => {
        queryBuilder.whereNull('today_dmsl.id').orWhere(queryBuilder => {
          queryBuilder
            .where('da.token', 'decommissioned')
            .andWhere('today_dms.externalId', '<>', 'inactiveDecommissioned')
        })
      })
      .select(
        'd.id',
        'current_dms.externalId as currentMaintenanceStatusExternalId',
        'current_dmsl.data as currentMaintenanceStatusLogData',
        'da.token as approvalToken'
      )
    await Promise.each(devicesWithNoMaintenanceLogForTheDay, async device => {
      const {
        id,
        approvalToken,
        currentMaintenanceStatusExternalId,
        currentMaintenanceStatusLogData = '{}',
      } = device
      let deviceMaintenanceStatusForTheDay =
        currentMaintenanceStatusExternalId || 'inactiveUnknown'
      if (approvalToken === 'decommissioned') {
        deviceMaintenanceStatusForTheDay = 'inactiveDecommissioned'
      }
      await automaticallySetDeviceMaintenanceStatus(
        id,
        today,
        deviceMaintenanceStatusForTheDay,
        {
          ...JSON.parse(currentMaintenanceStatusLogData),
          ...action,
        },
        messageContext
      )
    })
  })
}

module.exports = {
  listDevices,
  showDevice,
  updateDevice,
  listApprovalTypes,
  listMaintenanceStatuses,
  listDevicesForSelectList,
  getDevice,
  updateDeviceMaintenance,
  getDevicePerformance,
  getDevicesForReport,
  getDevicesForRifResistanceReport,
  getDeviceByDeviceId,
  manuallySetDeviceMaintenanceStatus,
  onDeviceMaintenanceStatusLogged,
  automaticallySetDeviceMaintenanceStatus,
  onResultLogged,
  onDeviceMaintenanceResolved,
  onDeviceUpdateMaintenanceStatusNoResults,
  onDeviceUpdateMaintenanceStatus,
  deviceMaintenanceStatusHistory,
  deviceMaintenanceStatus,
  onDeviceMaintenanceStatusLogScheduled,
}
