const _ = require('lodash')
const Boom = require('@hapi/boom')
const Promise = require('bluebird')
const {
  addDays,
  addYears,
  subMonths,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  format,
  isWeekend,
  parseJSON,
} = require('date-fns')
const { getAccountDetailsForUsername } = require('../accountDetails/service')

const { deviceMaintenanceStatusLogged } = require('./actions')
const { knex, filterParams, filterDateRangeParams, sortPageParams, transact } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getUser } = require('../auth/service')
const {
  allResultCategoryToId,
  allDeviceMaintenanceStatusToId,
  deviceApprovalToId,
  resultCategoryToId,
  deviceMaintenanceTypeToId,
} = require('../shared/dictionary')
const {
  parseDateOrDefault,
  startOfDayUtc,
  startOfTodayUtc,
  formatDateOrDefault,
  getArrayOfDaysInRange,
} = require('../shared/date')
const { getOffsetFromIsoDateString, getDateTimeProjectionInUserTimeZone } = require('../shared/date')
const { shouldTriggerInstrumentReplaced } = require('../plugin/utils')
const { INTERNAL_DEVICE_IDS } = require('../shared/constants')

function getSelectListFields(userTimeOffset, { lastSeenField } = {}) {
  const fields = SELECT_LIST_FIELDS
  fields.push(getDateTimeProjectionInUserTimeZone(knex, 'd.createdOn', userTimeOffset, 'createdOn'))
  fields.push(getDateTimeProjectionInUserTimeZone(knex, 'd.lastPingOn', userTimeOffset, 'lastPingOn'))
  fields.push(getDateTimeProjectionInUserTimeZone(knex, lastSeenField ?? 'd.lastSeenOn', userTimeOffset, 'lastSeen'))
  return fields
}

const SELECT_LIST_FIELDS = [
  'd.id',
  'd.name',
  'd.shortName',
  'st.name as state',
  'dt.name as type',
  's.name as siteName',
  knex.raw("CASE WHEN da.token = 'approved' AND ISNULL(dms.name) = 0 THEN dms.name ELSE da.name END as status"),
  knex.raw(
    "CASE WHEN da.token = 'approved' AND ISNULL(dms.i18nKey) = 0 THEN dms.i18nKey ELSE da.i18nKey END as statusI18nKey"
  ),
  'da.name as approval',
  'dms.externalId as maintenanceStatus',
  'dms.i18nKey as maintenanceStatusI18nKey',
  'da.i18nKey as approvalStatusI18nKey',
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
  'da.i18nKey as approvalStatusI18nKey',
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
  const loggedUserName = auth.credentials.name
  const accountDetails = await getAccountDetailsForUsername(loggedUserName)
  const resultCategoryErrorId = await resultCategoryToId('Error')
  const { assayId } = query
  const assayFilter = assayId ? (_.isArray(assayId) ? assayId.join(',') : assayId) : null
  const deviceQuery = knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin(
      knex('FactResultsDeviceByAssay as fact')
        .where('fact.days', 30)
        .modify(filter => {
          if (assayFilter) filter.whereRaw('fact.assayId in (?)', assayFilter)
        })
        .groupBy('deviceId')
        .select('fact.deviceId', knex.raw('sum(resultCount) as resultCount'))

        .as('frd30'),
      'frd30.deviceId',
      'd.id'
    )
    .leftJoin(
      knex('FactResultsDeviceByAssay as fact')
        .where('fact.days', 60)
        .modify(filter => {
          if (assayFilter) filter.whereRaw('fact.assayId in (?)', assayFilter)
        })
        .groupBy('deviceId')
        .select('fact.deviceId', knex.raw('sum(resultCount) as resultCount'))

        .as('frd60'),
      'frd60.deviceId',
      'd.id'
    )
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
    .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.id')
    .leftJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
    .where(queryBuilder => {
      if (query.deviceIds) {
        queryBuilder.whereIn('d.id', query.deviceIds.split(','))
      }
      if (query.deviceMaintenanceStatusId && !_.isEmpty(query.deviceMaintenanceStatusId)) {
        queryBuilder.whereIn('dms.externalId', query.deviceMaintenanceStatusId)
      }
      if (query.connectorStatus) {
        queryBuilder.whereIn(
          knex.raw('CASE WHEN d.lastPingOn > DATE_ADD(NOW(), INTERVAL -1 DAY) THEN "online" ELSE "offline" END'),
          query.connectorStatus
        )
      }
    })
    .whereNotIn('dt.externalId', INTERNAL_DEVICE_IDS)
    .modify(queryBuilder => {
      if (query.onlyOpenIssues || query.issueTypeId) {
        queryBuilder.innerJoin(
          'Issue as issue',
          joinBuilder => joinBuilder.on('issue.deviceId', 'd.id').andOn(knex.raw('issue.resultId is null')) // not interested in result-specific issues
        )

        if (query.issueTypeId)
          queryBuilder
            .innerJoin('IssueType as issueType', 'issue.issueTypeId', 'issueType.id')
            .whereIn('issueType.externalId', query.issueTypeId)

        if (query.onlyOpenIssues)
          queryBuilder.innerJoin('IssueStatus as issueStatus', joinBuilder =>
            joinBuilder
              .on('issue.issueStatusId', 'issueStatus.id')
              .andOn(knex.raw("issueStatus.externalId not in ('Inactive','OK','Resolved')"))
          )
      }
    })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      deviceName: 'd.name',
      deviceApprovalId: 'd.deviceApprovalId',
      deviceTypeId: 'd.deviceTypeId',
      deviceType: 'dt.externalId',
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
      showUnapprovedDevices: true,
      showDecommissionedDevices: true,
    })
  // get total count for paging
  const getCount = deviceQuery.clone().countDistinct('d.id as count').first()
  const userTimeOffset = '+00:00' // TODO: get time offset from somewhere and put here, as there is no datetime parameter to use getOffsetFromIsoDateString(someIsoDateParam) here.
  // get rows
  const getItems = deviceQuery
    .clone()
    .leftJoin(
      knex('Result as resDevice')
        .select('deviceId', knex.raw('max(resDevice.endedOn) as lastResultConductedOn'))
        .groupBy('deviceId')
        .as('deviceResult'),
      'd.id',
      'deviceResult.deviceId'
    )
    .leftJoin(
      knex('DeviceMaintenanceStatusLog as d')
        .select('deviceId', 'day', knex.raw('max(s.active) as active'))
        .innerJoin('DeviceMaintenanceStatus as s', 'd.deviceMaintenanceStatusId', 's.id')
        .whereRaw('WEEKDAY(day) < 5') // 5 - Saturday, 6 - Sunday
        .andWhere('day', '>=', knex.raw('DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)'))
        .groupBy('deviceId', 'day')
        .as('dmslActivity'),
      'dmslActivity.deviceId',
      'd.id'
    )
    .leftJoin(
      knex('Issue as i')
        .select('i.deviceId', knex.raw('GROUP_CONCAT(DISTINCT ic.i18nKey) as categories'))
        .innerJoin('Notification as n', 'n.issueId', 'i.id')
        .leftJoin('AlertMessage as a', 'a.id', 'n.alertMessageId')
        .innerJoin('IssueType as it', 'i.issueTypeId', 'it.id')
        .innerJoin('IssueStatus as ist', 'i.issueStatusId', 'ist.id')
        .leftOuterJoin('IssueCategory as ic', leftBuilder =>
          leftBuilder.on('it.issueCategoryId', 'ic.id').andOn('it.hasTag', knex.raw('1'))
        )
        .whereNotIn('ist.externalId', ['Inactive', 'OK', 'Resolved'])
        .modify(queryBuilder => {
          if (query.issueTypeId) queryBuilder.whereIn('it.externalId', query.issueTypeId)
        })
        .where('a.personId', accountDetails.id)
        .groupBy('i.deviceId')
        .as('issues'),
      'issues.deviceId',
      'd.id'
    )
    .modify(sortPageParams, query, 'name')
    .groupBy('d.id')
    .select([
      ...getSelectListFields(userTimeOffset, {
        lastSeenField: `CASE WHEN dms.active = 1 THEN GREATEST(dmsl.day, d.lastSeenOn) ELSE d.lastSeenOn END`,
      }),
      'frd30.resultCount as resultCountThisMonth',
      knex.raw('frd60.resultCount - frd30.resultCount as resultCountLastMonth'),
      'frd30Errors.resultCount as thisMonthErrors',
      knex.raw('count(distinct dmslActivity.day) as totalDays'),
      knex.raw('count(distinct case when dmslActivity.active = 1 then dmslActivity.day else null end) as activeDays'),
      'issues.categories as issueCategories',
      'dms.active as isDeviceActive',
      'dmsl.day as dmslDay',
      'd.lastSeenOn as deviceLastSeenOn',
      knex.raw(
        'CASE WHEN d.lastPingOn > DATE_ADD(NOW(), INTERVAL -1 DAY) THEN "online" ELSE "offline" END AS connectorStatus'
      ),
      knex.raw('d.ConfigurationData ->> "$.gxConnectVersion" AS connectorVersion'),
      knex.raw('deviceResult.lastResultConductedOn AS lastResultConductedOn'),
      knex.raw(`CASE 
        WHEN dms.externalId IN ('active', 'reportedActive', 'inactiveNoTestsPerformed') THEN 'up'
        WHEN dms.externalId IN ('inactiveUnknown') THEN 'unknown'
        ELSE 'down' END AS 'deviceStatus'`),
    ])
    .distinct()

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const toSyncDmslAndDevice = {}
  data.forEach(it => {
    it.availability = {
      count: it.activeDays ? it.activeDays : 0,
      total: it.totalDays ? it.totalDays : 0,
      rate: it.totalDays && it.totalDays > 0 ? it.activeDays / it.totalDays : 1,
    }
    delete it.activeDays
    delete it.totalDays

    it.error = {
      count: it.thisMonthErrors || 0,
      total: it.resultCountThisMonth || 0,
      rate: it.resultCountThisMonth ? it.thisMonthErrors / it.resultCountThisMonth : 0,
    }
    delete it.thisMonthErrors

    it.issueCategories = it.issueCategories ? it.issueCategories.split(',').map(key => ({ key })) : []

    /**
     * for Active devices - get devices when Device.lastSeenOn < DeviceMaintenanceStatusLog.day
     */
    if (+it.isDeviceActive && it.deviceLastSeenOn && it.dmslDay && it.deviceLastSeenOn < it.dmslDay) {
      toSyncDmslAndDevice[it.id] = { lastSeenOn: it.dmslDay }
    }
    delete it.dmslDay
    delete it.deviceLastSeenOn
    delete it.isDeviceActive
  })

  if (!_.isEmpty(toSyncDmslAndDevice)) {
    await Promise.all(
      _.map(_.keys(toSyncDmslAndDevice), async deviceId => {
        const { lastSeenOn } = toSyncDmslAndDevice[deviceId]
        return knex('Device').where({ id: deviceId }).update({ lastSeenOn, updatedOn: new Date() })
      })
    )
  }

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

async function getDeviceByDeviceId({ deviceId, credentials, fields = SELECT_SHOW_FIELDS }) {
  const dataConstraints = await getConstraints(credentials)

  const maintenanceCalibrationId = await deviceMaintenanceTypeToId('calibration')
  const maintenanceWarrantyId = await deviceMaintenanceTypeToId('warranty')

  const resultCategoryErrorId = await resultCategoryToId('Error')

  const device = await getDeviceByIdBaseQuery(dataConstraints, deviceId, fields, true, true)
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
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
    .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.id')
    .leftJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      deviceType: 'dt',
      showUnapprovedDevices: true,
      showDecommissionedDevices: true,
    })

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

  device.resultCountLastMonth = device.resultCount60 - device.resultCountThisMonth
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

  const configurationData = _.assign({}, device.configurationData, payload.configurationData)

  let { deviceApprovalId } = device
  // check if a approvalToken is provided
  if (_.has(payload, 'approvalToken') && device.approvalToken !== payload.approvalToken) {
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
  const getItems = resultQuery.clone().orderBy('id', 'asc').select('id', 'name', 'i18nKey')

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

const getMaintenanceStatusesQuery = (filter = null) =>
  knex('DeviceMaintenanceStatus as dms').modify(q => {
    if (filter) q.where(filter)
  })

async function listMaintenanceStatuses(request) {
  const { onlyManuallySet } = request.query
  const resultQuery = getMaintenanceStatusesQuery().where(builder => {
    if (onlyManuallySet) {
      builder.where({ manuallySet: onlyManuallySet })
    }
  })

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
  const {
    query,
    query: { showUnapprovedDevices, onlyResultDevices },
    auth,
  } = request
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const devicesQuery = knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .modify(addConstraints, dataConstraints, { device: 'd', geography: 'g', showUnapprovedDevices })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      partnerId: 'd.partnerId',
      siteId: 'd.siteId',
    })
    .whereNotIn('dt.externalId', INTERNAL_DEVICE_IDS)
    .orderBy(['d.name'], 'asc')
    .select('d.id', 'd.name', 'd.serial as deviceSerial', 'd.siteId', 'd.deviceTypeId', 'dt.name as deviceType')
  if (onlyResultDevices) {
    devicesQuery.where('dtc.hasResults', 1)
  }

  const devices = await devicesQuery
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

  let device = await getDeviceByIdBaseQuery(dataConstraints, params.deviceId, 'd.id', true, true)
  if (!device) {
    return Boom.notFound()
  }
  const { id: deviceId } = device

  const currentlyLoggedInUser = await getUser(credentials.name)

  const { externalId, contextDate = new Date(), notes } = payload
  const { id: deviceMaintenanceTypeId } = await knex('DeviceMaintenanceType').where({ externalId }).first('id')

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
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('Country as c', 'g.countryId', 'c.id')
    .modify(addConstraints, dataConstraints, { geography: 'g' })
    .where('d.id', deviceId)

  const [{ countryTotalResult, countryTotalErrorCount }] = await knex('Result as r')
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
        (x.totalResult * 100) / (getDaysInMonth(new Date(x.monthTested)) * deviceCapacity.dailyCapacity)
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
    errorRateAvg: Math.round((countryTotalErrorCount * 100) / countryTotalResult),
    data: _.sortBy(newData, [x => x.monthTested]),
  }
}

function getDeviceBaseQuery(query, dataConstraints, showUnapprovedDevices = false, showDecommissionedDevices = false) {
  const deviceQuery = knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('Assay as a', 'dt.id', 'a.deviceTypeId')
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.stateId', 'lg.id')
    .where(queryBuilder => {
      if (!query.deviceIds) {
        return
      }
      queryBuilder.whereIn('d.id', query.deviceIds.split(','))
    })
    .modify(queryBuilder => {
      if (query.assayId || query.assayExternalId) queryBuilder.innerJoin('Assay as a', 'dt.id', 'a.deviceTypeId')
      if (query.assayId) {
        const { assayId } = query
        const assayIds = _.isArray(assayId) ? assayId : [assayId]
        queryBuilder.whereIn('a.id', assayIds)
      }
      if (query.assayExternalId) queryBuilder.where('a.externalId', query.assayExternalId)
      if (query.resultCategoryId)
        queryBuilder
          .innerJoin('ResultCategoryAssay as rca', 'a.id', 'rca.assayId')
          .where('rca.resultCategoryId', query.resultCategoryId)

      if (query.resultCategory2Id)
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
      deviceType: 'dt.externalId',
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
      showDecommissionedDevices,
      showUnapprovedDevices,
    })
  return deviceQuery
}

// ---------------------------------
// helper func for 2 worksheets in `Critical Errors by Device` report
// ---------------------------------
async function getBasicsForDevicesReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const resultCategoryIds = await allResultCategoryToId()
  const deviceQuery = getDeviceBaseQuery(query, dataConstraints)

  // get total count for paging
  const getCount = deviceQuery.clone().countDistinct('d.id').as('count').first()
  const queryResults = knex('Result as r')
    .leftJoin('Sample as sa', 'r.sampleId', 'sa.id')
    .modify(addConstraints, dataConstraints, {
      result: 'r',
      sample: 'sa',
    })
    .whereRaw('r.deviceId = d.id')
    .modify(filterDateRangeParams, query, 'r.endedOn')

  return {
    getCount,
    queryResults,
    deviceQuery,
    resultCategoryIds,
  }
}

// ---------------------------------
// get devices with different aggregations for reports
// ---------------------------------
async function getDevicesForReport(auth, query) {
  const { getCount, queryResults, deviceQuery, resultCategoryIds } = await getBasicsForDevicesReport(auth, query)
  const userTimeOffset = getOffsetFromIsoDateString(query.maxDate)

  // get rows
  const getItems = deviceQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .groupBy('d.id')
    .select([
      ..._.filter(getSelectListFields(userTimeOffset), elem => _.isString(elem) && elem.indexOf('dms.') < 0),
      'd.serial',
      queryResults.clone().countDistinct('r.id').as('totalResults'),
      queryResults.clone().where('r.resultCategory1', resultCategoryIds.Error).countDistinct('r.id').as('totalErrors'),
      queryResults
        .clone()
        .where('r.resultCategory1', resultCategoryIds.Invalid)
        .countDistinct('r.id')
        .as('totalInvalid'),
      queryResults
        .clone()
        .innerJoin('ResultWorkflowLog as rl', 'r.resultWorkflowStatusLogId', 'rl.id')
        .max('rl.changedOn')
        .as('lastUploadOn'),

      queryResults
        .clone()
        .whereRaw('sa.originSiteId = d.siteId')
        .countDistinct('r.id')
        .as('totalResults_sameOriginSite'),
      queryResults
        .clone()
        .whereRaw('sa.originSiteId = d.siteId')
        .where('r.resultCategory1', resultCategoryIds.Error)
        .countDistinct('r.id')
        .as('totalErrors_sameOriginSite'),
      queryResults
        .clone()
        .whereRaw('sa.originSiteId = d.siteId')
        .where('r.resultCategory1', resultCategoryIds.Invalid)
        .countDistinct('r.id')
        .as('totalInvalid_sameOriginSite'),
    ])

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const getPercentage = (totalResults, totalErrors) => {
    return Math.round(100 * (totalResults ? totalErrors / totalResults : 0)) / 100
  }
  // add more fields which depend on aggregations
  data.forEach(async it => {
    it.errorRate = getPercentage(it.totalResults, it.totalErrors)
    it.errorRate_sameOriginSite = getPercentage(it.totalResults_sameOriginSite, it.totalErrors_sameOriginSite)
  })

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function getErrorCodesByDeviceReport(auth, query) {
  const { getCount, queryResults, deviceQuery, resultCategoryIds } = await getBasicsForDevicesReport(auth, query)

  const getItems = deviceQuery
    .clone()
    .groupBy('d.id')
    .modify(sortPageParams, query, 'name')
    .select([
      'd.name',
      queryResults.clone().where('r.errorCode', '5011').countDistinct('r.id').as('error_5011'),
      queryResults.clone().where('r.errorCode', '5007').countDistinct('r.id').as('error_5007'),
      queryResults.clone().where('r.errorCode', '5006').countDistinct('r.id').as('error_5006'),
      queryResults.clone().where('r.errorCode', '2008').countDistinct('r.id').as('error_2008'),
      queryResults.clone().where('r.errorCode', '2005').countDistinct('r.id').as('error_2005'),
      queryResults.clone().where('r.errorCode', '2037').countDistinct('r.id').as('error_2037'),
      queryResults.clone().where('r.errorCode', '2025').countDistinct('r.id').as('error_2025'),
      queryResults.clone().where('r.errorCode', '2022').countDistinct('r.id').as('error_2022'),
      queryResults
        .clone()
        .where('r.resultCategory1', resultCategoryIds.Error)
        .whereRaw(
          `(
            r.errorCode IS NULL 
            OR 
            r.errorCode NOT IN ('5011', '5007', '5006', '2008', '2005', '2037', '2025', '2022')
          )`
        )
        .countDistinct('r.id')
        .as('error_other'),
      queryResults
        .clone()
        .where('r.resultCategory1', resultCategoryIds.NoResult)
        .countDistinct('r.id')
        .as('mtbNoResult'),
      queryResults.clone().where('r.resultCategory1', resultCategoryIds.Invalid).countDistinct('r.id').as('mtbInvalid'),
    ])

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = {
    ok: true,
    total,
    length: data.length,
    data,
    dataSelector: ({ name, ...dataRow }) => {
      return {
        name,
        ...dataRow,
        total: Object.values(dataRow).reduce((a, b) => a + b),
      }
    },
  }

  return result
}

async function getDevicesForRifResistanceReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const resultCategoryIds = await allResultCategoryToId()
  const deviceQuery = getDeviceBaseQuery(
    {
      sortCol: 'name',
      sortDir: 'asc',
      hasResults: 1,
      ...query,
    },
    dataConstraints
  )
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra'])
    // Group for avoiding join duplications
    .groupBy(['d.id'])

  // get total count for paging
  const getCount = deviceQuery.clone().count('d.id as count')

  const queryResults = knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .modify(addConstraints, dataConstraints, {
      result: 'r',
      sample: 's',
    })
    .whereRaw('r.siteId = d.siteId')
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra'])
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
    it.rifResistanceRate = it.totalDetected1 ? it.totalDetected2 / it.totalDetected1 : 0
  })

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function setDeviceMaintenanceStatus(deviceId, userId, deviceMaintenanceStatusId, dayDate, data, messageContext) {
  const [deviceMaintenanceStatusLogId] = await knex('DeviceMaintenanceStatusLog').insert({
    deviceId,
    deviceMaintenanceStatusId,
    day: dayDate,
    data: _.isString(data) ? data : JSON.stringify(data),
    createdOn: new Date(),
    createdBy: userId,
  })
  if (!messageContext.deviceMaintenanceStatusLogged)
    messageContext.bindActionCreators({
      deviceMaintenanceStatusLogged,
    })
  messageContext.deviceMaintenanceStatusLogged(deviceMaintenanceStatusLogId)
  return deviceMaintenanceStatusLogId
}

function getDeviceByIdBaseQuery(
  dataConstraints,
  deviceId,
  fields = 'd.*',
  showUnapprovedDevices = false,
  showDecommissionedDevices = false
) {
  const query = knex('Device as d')
    .innerJoin('Partner as p', 'd.partnerId', 'p.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .modify(addConstraints, dataConstraints, {
      partner: 'p',
      geography: 'g',
      site: 's',
      device: 'd',
      showUnapprovedDevices,
      showDecommissionedDevices,
    })
    .where('d.id', +deviceId)
    .first(fields)

  return query
}

const getDeviceMaintenanceStatusesInRange = async (deviceId, dateFrom, dateTo) =>
  knex('DeviceMaintenanceStatusLog as dmsl')
    .where({ deviceId })
    .innerJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
    .andWhere('day', '>=', dateFrom)
    .andWhere('day', '<=', dateTo)
    .distinct('dms.externalId')
    .pluck('dms.externalId')

async function setStatusForDateRange(request) {
  const {
    auth: { credentials },
    params: { deviceId },
    payload,
    plugins: { messageContext },
  } = request
  const { externalId, day = startOfTodayUtc(), notes } = payload
  let { dateFrom, dateTo } = payload

  if (!dateFrom && !dateTo) {
    dateFrom = day
    dateTo = day
  }

  const dataConstraints = await getConstraints(credentials)
  const user = await getUser(credentials.name)

  // Get device or throw boom error if it's a bad request
  const device = await getDeviceByIdBaseQuery(dataConstraints, deviceId, 'd.*', true, true)
  if (!device) throw Boom.forbidden("You don't have permissions for updating the requested device")

  // >>> VALIDATIONS
  const deviceMaintenanceStatus = await getMaintenanceStatusesQuery({
    externalId,
  }).first()
  if (!deviceMaintenanceStatus)
    throw Boom.badRequest('The provided device maintenance status external id does not exist')
  else {
    const { manuallySet } = deviceMaintenanceStatus
    const statusesInDateRange = await getDeviceMaintenanceStatusesInRange(deviceId, dateFrom, dateTo)

    if (statusesInDateRange.includes('inactiveDecommissioned'))
      throw Boom.badRequest('You cannot change the status of a device in days when it was decommissioned')
    else if (!manuallySet) throw Boom.badRequest("The status you are trying to assign can't be set manually")
    else if (statusesInDateRange.includes('active'))
      throw Boom.badRequest('You cannot change the status of a device in days when it was active')
    else if (externalId === 'inactiveDecommissioned')
      throw Boom.badRequest('Status "Decommissioned" cannot be set for a date range')
    else if (statusesInDateRange.includes('inactiveNoTestsPerformed') && externalId === 'reportedActive')
      throw Boom.badRequest(
        'You cannot change the status of a device to "Reported Active" for days when it was reported as "No Tests Performed"'
      )
  }
  // >>>

  const data = {
    maintenanceStatus: deviceMaintenanceStatus.externalId,
    maintenanceStatusI18nKey: deviceMaintenanceStatus.i18nKey,
    maintenanceStatusName: deviceMaintenanceStatus.name,
    maintenanceStatusActive: deviceMaintenanceStatus.active,
    maintenanceStatusNotes: notes,
    maintenanceStatusManuallySet: deviceMaintenanceStatus.manuallySet,
  }

  if (
    /**
     * TODO: empty/disable days in UI for dates BEFORE device createdOn
     * see ASP-2007 for details
     */
    // dateFrom >= startOfDayUtc(device.createdOn) &&
    dateFrom <= dateTo &&
    dateTo <= new Date()
  ) {
    // Everything all right, then insert logs
    if (notes) {
      _.set(payload, 'options.data.notes', notes)
    }

    const deviceMaintenanceStatusLogIds = []
    await Promise.mapSeries(getArrayOfDaysInRange(dateFrom, dateTo), async day => {
      deviceMaintenanceStatusLogIds.push(
        await setDeviceMaintenanceStatus(
          deviceId,
          user.id,
          deviceMaintenanceStatus.id,
          startOfDayUtc(day),
          payload,
          messageContext
        )
      )
    })

    if (!payload.dateFrom && !payload.dateTo) {
      ;[data.deviceMaintenanceStatusLogId] = deviceMaintenanceStatusLogIds
    } else data.deviceMaintenanceStatusLogIds = deviceMaintenanceStatusLogIds

    return {
      ok: true,
      data,
    }
  }
  throw Boom.badRequest('Invalid date range')
}

async function automaticallySetDeviceMaintenanceStatus(
  deviceId,
  day,
  deviceMaintenanceStatusExternalId,
  data,
  messageContext
) {
  const dayDate = startOfDayUtc(day)

  const latestDeviceMaintenanceStatusForDay =
    (await knex('DeviceMaintenanceStatusLog as dmsl')
      .join('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
      .where('dmsl.deviceId', deviceId)
      .andWhere('dmsl.day', dayDate)
      .orderByRaw('dmsl.createdOn desc, dmsl.id desc')
      .first('dms.*')) || {}

  if (
    latestDeviceMaintenanceStatusForDay.externalId === deviceMaintenanceStatusExternalId ||
    (!latestDeviceMaintenanceStatusForDay.manuallySet && latestDeviceMaintenanceStatusForDay.active)
  ) {
    // If, in the day, the device was already in an automatically
    //   set active status it can't be automatically overwritten
    return
  }
  const { id: deviceMaintenanceStatusId } =
    (await knex('DeviceMaintenanceStatus').where({ externalId: deviceMaintenanceStatusExternalId }).first('id')) || {}

  if (!deviceMaintenanceStatusId) {
    return Boom.badRequest(
      `${deviceMaintenanceStatusExternalId} is not a known maintenance status that can be automatically set`
    )
  }
  await setDeviceMaintenanceStatus(deviceId, null, deviceMaintenanceStatusId, dayDate, data, messageContext)
}

async function onDeviceMaintenanceStatusLogged({ deviceMaintenanceStatusLogId }, { messageContext }) {
  return messageContext.run(async knex => {
    if (!deviceMaintenanceStatusLogId) return

    const { deviceId } =
      (await knex('DeviceMaintenanceStatusLog').where('id', deviceMaintenanceStatusLogId).first('deviceId')) || {}
    if (!deviceId) return

    const { latestDeviceMaintenanceStatusLogId, currentDeviceMaintenanceStatusLogId } =
      (await knex('DeviceMaintenanceStatusLog as dmsl')
        .join('Device as d', 'dmsl.deviceId', 'd.id')
        .where('dmsl.deviceId', deviceId)
        .orderByRaw('dmsl.day desc, dmsl.createdOn desc, dmsl.id desc')
        .first(
          'dmsl.id as latestDeviceMaintenanceStatusLogId',
          'd.deviceMaintenanceStatusLogId as currentDeviceMaintenanceStatusLogId'
        )) || {}
    if (currentDeviceMaintenanceStatusLogId !== latestDeviceMaintenanceStatusLogId) {
      await knex('Device').where('id', deviceId).update({
        deviceMaintenanceStatusLogId: latestDeviceMaintenanceStatusLogId,
        updatedOn: new Date(),
      })
    }
  })
}

/**
 * Updates all the device maintenance status logs set to inactiveUnknown for days previous to the given date limit, setting their status to inactiveNoTestsPerformed
 * @param {int} deviceId The device id of the maintenance to be updated
 * @param {Date} dateLimit The date limit until the statuses will be updated
 */
async function updateStatusUnknownToNoTestsPerformed(deviceId, dateLimit) {
  const statusesByExternalId = await allDeviceMaintenanceStatusToId()
  const inactiveUnknownId = statusesByExternalId.inactiveUnknown
  const inactiveNoTestsPerformedId = statusesByExternalId.inactiveNoTestsPerformed
  await knex('DeviceMaintenanceStatusLog')
    .where('day', '<', dateLimit)
    .andWhere({ deviceId, deviceMaintenanceStatusId: inactiveUnknownId })
    .update({ deviceMaintenanceStatusId: inactiveNoTestsPerformedId })
}

async function onResultLogged(action, { messageContext }) {
  const { resultId } = action
  return messageContext.run(async knex => {
    const { deviceId, startedOn, endedOn, approvalToken } =
      (await knex('Result as r')
        .leftJoin('Device as d', 'r.deviceId', 'd.id')
        .leftJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
        .where('r.id', resultId)
        .first('r.deviceId', 'r.startedOn', 'r.endedOn', 'da.token as approvalToken')) || {}

    if (deviceId && (endedOn || startedOn)) {
      const testDateToUse = endedOn || startedOn

      await automaticallySetDeviceMaintenanceStatus(
        deviceId,
        testDateToUse,
        approvalToken === 'decommissioned' ? 'inactiveDecommissioned' : 'active',
        action,
        messageContext
      )

      /**
       * If it is the first result for the current day and deviceId, then update all the previous inactiveUnknown statuses
       * The device is active for today, and results should be synced, so the inactiveUnknown statuses should actually be inactiveNoTestsPerformed
       */
      const { numberOfPreviousTestsInDay } = await knex('Result as r')
        .where(knex.raw('DATE(endedOn)'), format(testDateToUse, 'yyyy-MM-dd'))
        .andWhere('id', '<', resultId)
        .andWhere({ deviceId })
        .count('r.id as numberOfPreviousTestsInDay')
        .first()
      if (numberOfPreviousTestsInDay === 0) await updateStatusUnknownToNoTestsPerformed(deviceId, testDateToUse)

      await shouldTriggerInstrumentReplaced(knex, messageContext, resultId)
    }
  })
}

async function onDeviceMaintenanceResolved(action, { messageContext }) {
  const { deviceId } = action
  if (deviceId) {
    return automaticallySetDeviceMaintenanceStatus(
      deviceId,
      startOfTodayUtc(),
      'reportedActive',
      action,
      messageContext
    )
  }
  return Promise.resolve()
}

async function onDeviceUpdateMaintenanceStatusNoResults(action, { messageContext }) {
  const { deviceId, options = {} } = action
  if (deviceId) {
    const daysSinceLastResult = []
    let day = options.lastResultOn ? startOfDayUtc(parseDateOrDefault(options.lastResultOn)) : startOfDayUtc(new Date())
    while (day < new Date()) {
      daysSinceLastResult.push(day)
      day = addDays(day, 1)
    }
    await Promise.each(daysSinceLastResult, day =>
      automaticallySetDeviceMaintenanceStatus(deviceId, day, 'inactiveUnknown', action, messageContext)
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
        repair: 'inactiveDownForRepair',
        decommissioned: 'inactiveDecommissioned',
      }[maintenanceReasonFromSource] || 'inactiveUnknown'
    return automaticallySetDeviceMaintenanceStatus(
      deviceId,
      startOfTodayUtc(),
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
  while (day <= (maxDate || startOfTodayUtc())) {
    days.push(day)
    day = addDays(day, 1)
  }
  const queryDeviceIds = query.deviceIds ? query.deviceIds.split(',') : []
  let filterByDeviceIds = await knex('Device as d')
    .leftJoin('DeviceMaintenanceStatusLog as dmsl', queryBuilder => {
      queryBuilder
        .on(knex.raw('dmsl.day BETWEEN ? AND ?', [days[0], days[days.length - 1]]))
        .andOn('d.id', 'dmsl.deviceId')
    })
    .innerJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
    .modify(queryBuilder => {
      if (query.deviceMaintenanceStatusId && !_.isEmpty(query.deviceMaintenanceStatusId)) {
        queryBuilder.whereIn('dms.externalId', query.deviceMaintenanceStatusId)
      }
      if (!_.isEmpty(queryDeviceIds)) {
        queryBuilder.whereIn('d.id', queryDeviceIds)
      }
    })
    .distinct('d.id')
    .pluck('d.id')

  const userTimeOffset = getOffsetFromIsoDateString(query.maxDate)

  const devicesWithConstraints = _.isEmpty(filterByDeviceIds)
    ? []
    : await knex('Device as d')
        .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
        .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
        .innerJoin('Site as s', 'd.siteId', 's.id')
        .leftJoin('Geography as g', 's.geographyId', 'g.id')
        .leftJoin('State as st', 'g.stateId', 'st.id')
        .leftJoin('Assay as a', 'dt.id', 'a.deviceTypeId')
        .leftJoin('AssayType as at', 'a.assayTypeId', 'at.id')
        .leftJoin('Disease as dis', 'at.diseaseId', 'dis.id')
        .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.id')
        .leftJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
        .whereIn('d.id', filterByDeviceIds)
        .andWhere('dc.hasResults', true)
        .modify(filterParams, query, {
          countryId: 'g.countryId',
          stateId: 'g.stateId',
          lgaId: 'g.lgaId',
          deviceName: 'd.name',
          deviceApprovalId: 'd.deviceApprovalId',
          deviceTypeId: 'd.deviceTypeId',
          deviceType: 'dt.externalId',
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
        .select(getSelectListFields(userTimeOffset))
        .distinct()

  filterByDeviceIds = devicesWithConstraints.map(({ id }) => id)

  const latestDeviceMaintenanceStatusLogsPerDay = await knex('Device as d')
    .leftOuterJoin('DeviceMaintenanceStatusLog as dmsl', 'd.id', 'dmsl.deviceId')
    .leftOuterJoin('DeviceMaintenanceStatusLog as dmslNewer', queryBuilder => {
      queryBuilder
        .on('dmslNewer.deviceId', 'dmsl.deviceId')
        .andOn('dmslNewer.day', 'dmsl.day')
        .andOn(function () {
          this.on('dmslNewer.createdOn', '>', 'dmsl.createdOn')
          this.orOn(function () {
            this.on('dmslNewer.createdOn', '=', 'dmsl.createdOn').andOn('dmslNewer.id', '>', 'dmsl.id')
          })
        })
    })
    .leftOuterJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
    .whereNull('dmslNewer.id')
    .whereIn('d.id', filterByDeviceIds)
    .whereRaw('dmsl.day >= ? AND dmsl.day <= ?', [
      formatDateOrDefault(days[0], 'yyyy-MM-dd'),
      formatDateOrDefault(days[days.length - 1], 'yyyy-MM-dd'),
    ])
    .groupBy(['d.id', 'dmsl.day'])
    .select([
      'd.id as deviceId',
      'dmsl.deviceMaintenanceStatusId',
      'dms.externalId as deviceMaintenanceStatusExternalId',
      'dmsl.day',
      'dmsl.data',
      'dms.externalId',
    ])
    .then(items => {
      /**
       * if query.deviceMaintenanceStatusId is specified then return only items
       * for those devices which have this status for at least one day in range
       */
      if (query.deviceMaintenanceStatusId && !_.isEmpty(query.deviceMaintenanceStatusId)) {
        let correctedItems = []
        filterByDeviceIds.forEach(deviceId => {
          const itemsForDevice = items.filter(item => item.deviceId === deviceId)
          if (
            itemsForDevice.find(item =>
              query.deviceMaintenanceStatusId.includes(item.deviceMaintenanceStatusExternalId)
            )
          ) {
            correctedItems = [...correctedItems, ...itemsForDevice]
          }
        })
        return correctedItems
      }

      return items
    })

  // final device id's - which contain specified (if any) query.deviceMaintenanceStatusId
  filterByDeviceIds = [...new Set(latestDeviceMaintenanceStatusLogsPerDay.map(({ deviceId }) => deviceId))]

  const devices = devicesWithConstraints.filter(({ id }) => filterByDeviceIds.includes(id))

  // get total results per each device per period
  const deviceResultCounts = await knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Sample as s', 'r.sampleId', 's.id')
    .modify(addConstraints, dataConstraints, {
      result: 'r',
      sample: 's',
    })
    .modify(queryBuilder => {
      if (minDate) {
        queryBuilder.whereBetween('r.endedOn', [minDate, maxDate]).orWhere(queryBuilder => {
          queryBuilder.whereBetween('r.startedOn', [minDate, maxDate])
        })
      }
    })
    .whereIn('r.deviceId', filterByDeviceIds)
    .groupBy('r.deviceId')
    .select('r.deviceId')
    .count({
      resultCount: knex.raw('DISTINCT r.id'),
    })

  const result = {
    ok: true,
    total: devices.length,
    length: devices.length,
    data: devices.map(device => ({
      ...device,
      resultCount: (deviceResultCounts.find(item => item.deviceId === device.id) || {}).resultCount || 0,
      days: days.map(day => {
        const deviceMaintenanceStatusLog =
          latestDeviceMaintenanceStatusLogsPerDay.find(
            log => log.deviceId === device.id && format(log.day, 'yyyyMMdd') === format(day, 'yyyyMMdd')
          ) || {}
        const dayStatus = {
          date: day,
          externalId: deviceMaintenanceStatusLog.externalId || 'inactiveUnknown',
          isWeekend: isWeekend(day),
          data: {},
        }
        if (deviceMaintenanceStatusLog.data) {
          dayStatus.data = JSON.parse(deviceMaintenanceStatusLog.data)
          dayStatus.notes = _.get(deviceMaintenanceStatusLog, 'data.options.data.notes')
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
      .join('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.Id')
      .modify(addConstraints, dataConstraints, {
        device: 'd',
        showUnapprovedDevices: true,
        showDecommissionedDevices: true,
      })
      .where('d.id', deviceId)
      .first('dmsl.*')) || {}
  if (currentDeviceMaintenanceStatusLog.data) {
    currentDeviceMaintenanceStatusLog.data = JSON.parse(currentDeviceMaintenanceStatusLog.data)
    currentDeviceMaintenanceStatusLog.notes = _.get(currentDeviceMaintenanceStatusLog, 'data.options.data.notes', null)
  }
  return {
    ok: true,
    data: currentDeviceMaintenanceStatusLog,
  }
}

/**
 * Returns a list of objects for those devices that:
 * - Do not have a maintenance status log for the given day
 * - Have a maintenance status log for the given day, but it's 'inactiveUnknown'
 * - (not developed yet) Were decommissioned before the given day, but their maintenance status log for the given day is not 'inactiveDecommissioned'
 * @param {*} knex
 * @param {*} today The day to be processed
 * @returns
 */
async function getDevicesMaintenanceLogForTheDay(knex, today) {
  return knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .leftJoin('DeviceMaintenanceStatusLog as current_dmsl', 'd.deviceMaintenanceStatusLogId', 'current_dmsl.id')
    .leftJoin('DeviceMaintenanceStatus as current_dms', 'current_dmsl.deviceMaintenanceStatusId', 'current_dms.id')
    .leftJoin('DeviceMaintenanceStatusLog as today_dmsl', queryBuilder => {
      queryBuilder.on('d.id', 'today_dmsl.deviceId').andOn('today_dmsl.day', knex.raw('DATE(?)', [today]))
    })
    .leftJoin('DeviceMaintenanceStatus as today_dms', 'today_dmsl.deviceMaintenanceStatusId', 'today_dms.id')
    .leftJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .leftJoin('Result as r', queryBuilder => {
      queryBuilder.on('d.id', 'r.deviceId').andOn(function () {
        this.on(knex.raw('DATE(r.endedOn)'), knex.raw('DATE(?)', [today])).orOn(
          knex.raw('DATE(r.startedOn)'),
          knex.raw('DATE(?)', [today])
        )
      })
    })
    .where('dtc.hasResults', true)
    .andWhere(queryBuilder => {
      // Return data if the device's log does not exist for the given day
      // >>> REASON: We need to add the missing log
      queryBuilder
        .whereNull('today_dmsl.id')
        // Return data if the device is decommissioned but the log is not set to inactiveDecommissioned
        // >>> REASON: We need to set the maintenance as 'inactiveDecommissioned'
        // TODO: compare only decommissioned if the approval status decommissioned was set before the given day (we need to change relationships, from device-deviceApprovalStatus to device-deviceApprovalLog)
        .orWhere(queryBuilder => {
          queryBuilder
            .where('da.token', 'decommissioned')
            .andWhere('today_dms.externalId', '<>', 'inactiveDecommissioned')
        })
        // Return data if the device has a log for the given day, which is set to 'inactiveUnknown'
        // >>> REASON: We will need to to check if the device has future results, and set the current log to 'inactiveNoTestsPerformed' if that is true
        .orWhere('today_dms.externalId', 'inactiveUnknown')
    })
    .groupBy('d.id')
    .select(
      'd.id',
      'current_dms.externalId as currentMaintenanceStatusExternalId',
      'current_dms.active as currentMaintenanceStatusActive',
      'current_dmsl.data as currentMaintenanceStatusLogData',
      'current_dmsl.day as currentMaintenanceStatusDay',
      'da.token as approvalToken',
      'd.deviceApprovalId as deviceApprovalId',
      knex.raw('COUNT(r.id) as totalResults')
    )
}

async function onDeviceMaintenanceStatusLogScheduled(action, { messageContext }) {
  return messageContext.run(async knex => {
    const getCustomToday = today => {
      if (today) {
        if (_.isDate(today)) {
          return startOfDayUtc(today)
        }
        if (_.isString(today)) {
          return parseJSON(today)
        }
      }
      return startOfTodayUtc()
    }
    const today = getCustomToday(action.today)
    const devicesMaintenanceLogForTheDay = await getDevicesMaintenanceLogForTheDay(knex, today)

    await Promise.each(devicesMaintenanceLogForTheDay, async device => {
      const {
        id,
        approvalToken,
        currentMaintenanceStatusExternalId,
        currentMaintenanceStatusLogData = '{}',
        currentMaintenanceStatusDay,
        currentMaintenanceStatusActive,
        deviceApprovalId,
        totalResults,
      } = device

      // set maintenance status external id
      let deviceMaintenanceStatusForTheDay
      /**
       * If today is after the current log day,
       * and the last log was one of the inactive statuses,
       * then assume that the reason of inactivity is the same than before.
       */
      if (currentMaintenanceStatusExternalId && today > currentMaintenanceStatusDay && !currentMaintenanceStatusActive)
        deviceMaintenanceStatusForTheDay = currentMaintenanceStatusExternalId
      /**
       * Else, as we don't know the reason of inactivity, 'inactiveUnknown' will be set as default
       */ else deviceMaintenanceStatusForTheDay = 'inactiveUnknown'

      /**
       * If the device is currently decommissioned, we need to check if that is the reason of inactivity
       */
      if (approvalToken === 'decommissioned') {
        /**
         * If the device's last approval log is 'inactiveDecommissioned', and the day to process is after that approval log,
         * then we can assume the device inactivty reason is that it was decommissioned and no longer working
         */
        const decommissionedId = deviceApprovalId
        const lastDeviceApprovalLog = await knex('DeviceApprovalLog')
          .where({ deviceId: id })
          .orderBy('createdOn', 'desc')
          .first()

        if (lastDeviceApprovalLog) {
          const { createdOn: lastApprovalDate, deviceApprovalId: lastApprovalDeviceApprovalId } = lastDeviceApprovalLog
          if (lastApprovalDate < today && lastApprovalDeviceApprovalId === decommissionedId)
            deviceMaintenanceStatusForTheDay = 'inactiveDecommissioned'
        } else deviceMaintenanceStatusForTheDay = 'inactiveDecommissioned'
      } else if (totalResults === 0 && deviceMaintenanceStatusForTheDay === 'inactiveUnknown') {
        /**
         * If the device didn't report results in the day and we don't know the inactivity reason,
         * then we should check if it just didn't perform tests.
         * For checking this, we will see if it reported tests in the future, so if that's true, we can assume 'inactiveNoTestsPerformed' status.
         */
        const { totalFutureResults } = await knex('Result')
          .where({ deviceId: id })
          .andWhere('endedOn', '>', today)
          .count('id as totalFutureResults')
          .first()

        if (totalFutureResults > 0)
          // If has newer results, then we know that the device didn't performed tests in the day
          deviceMaintenanceStatusForTheDay = 'inactiveNoTestsPerformed'
      } else if (
        // if has result for the processed day, but the status is not active - then set it to active for TODAY
        totalResults > 0 &&
        deviceMaintenanceStatusForTheDay !== 'active'
      ) {
        deviceMaintenanceStatusForTheDay = 'active'
      }

      // set maintenance status log data
      const deviceMaintenanceStatusLogData =
        currentMaintenanceStatusDay === today ? currentMaintenanceStatusLogData : '{}'

      await automaticallySetDeviceMaintenanceStatus(
        id,
        today,
        deviceMaintenanceStatusForTheDay,
        {
          ...JSON.parse(deviceMaintenanceStatusLogData),
          ...action,
        },
        messageContext
      )
    })
  })
}

async function getDeviceCalibrationsForReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const deviceQuery = getDeviceBaseQuery(query, dataConstraints)
  const userTimeOffset = getOffsetFromIsoDateString(query.maxDate)
  // get total count for paging
  const getCount = deviceQuery.clone().count('d.id as count').first()

  // get rows
  const getItems = deviceQuery
    .clone()
    .leftOuterJoin('DeviceMaintenance as dm', queryBuilder => {
      queryBuilder.on('d.id', 'dm.deviceId').andOn('dm.current', 1)
    })
    .modify(sortPageParams, query, 'name')
    .select([
      ..._.filter(
        getSelectListFields(userTimeOffset),
        /**
         * make sure to exclude columns starting with `dms.` because
         * we do not have JOIN with DeviceMaintenanceStatus table
         */
        elem =>
          _.isString(elem) &&
          // is either -1 or > 0
          elem.indexOf('dms.') !== 0
      ),
      'd.serial',
      'dm.contextDate as calibratedOn',
    ])

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  // add more fields which depend on aggregations
  data.forEach(async it => {
    it.nextCalibrationOn = it.calibratedOn ? addYears(it.calibratedOn, 1) : null
  })

  const result = { ok: true, total, length: data.length, data }

  return result
}

// Reusable method to create a device log and update lastSeenOn for a device
// This method will sometimes be called in a context of a database transaction.
//  In this case the transaction's knex instance can be passed as the optionalKnex
//  parameter below.
async function postPayloadFromDevice(deviceLogDetails, optionalKnex) {
  const now = new Date()
  const databaseTransaction = async inlineKnex => {
    const [deviceLogId] = await inlineKnex('DeviceLog').insert({
      createdOn: now,
      ...deviceLogDetails,
    })
    await inlineKnex('Device').where({ id: deviceLogDetails.deviceId }).update({ lastSeenOn: now, updatedOn: now })
    return deviceLogId
  }
  if (!optionalKnex) {
    return transact(databaseTransaction)
  }
  return databaseTransaction(optionalKnex)
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
  getErrorCodesByDeviceReport,
  getDevicesForRifResistanceReport,
  getDeviceByDeviceId,
  onDeviceMaintenanceStatusLogged,
  automaticallySetDeviceMaintenanceStatus,
  onResultLogged,
  onDeviceMaintenanceResolved,
  onDeviceUpdateMaintenanceStatusNoResults,
  onDeviceUpdateMaintenanceStatus,
  deviceMaintenanceStatusHistory,
  deviceMaintenanceStatus,
  onDeviceMaintenanceStatusLogScheduled,
  getDeviceCalibrationsForReport,
  getDeviceBaseQuery,
  setStatusForDateRange,
  postPayloadFromDevice,
}
