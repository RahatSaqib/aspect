const _ = require('lodash')
const Boom = require('@hapi/boom')
const Promise = require('bluebird')
const { addDays, subMonths, startOfMonth, endOfMonth, format, parseJSON } = require('date-fns')
const { deviceMaintenanceStatusLogged, calibrationDateUpdated } = require('./actions')
const { knex, filterParams, filterDateRangeParams, sortParams, transact } = require('../db')
const { getConstraints, addConstraints, getUserFromCredentials } = require('../auth/constraints')
const { getUser } = require('../auth/service')
const { allResultCategoryToId, allDeviceMaintenanceStatusToId } = require('../shared/dictionary')
const {
  parseDateOrDefault,
  startOfDayUtc,
  startOfTodayUtc,
  formatDateOrDefault,
  getArrayOfDaysInRange,
  getMonthYearUserTimeZoneField,
  getTimezoneOffsetFromNumber,
  getOffsetFromIsoDateString,
  getDateTimeProjectionInTimeZoneIANA,
  isWeekend,
  getWorkingDays,
} = require('../shared/date')
const { lastDayOfMonthByOffsetAndResultEndedOn } = require('../shared/query')
const { shouldTriggerInstrumentReplaced } = require('../plugin/utils')
const { INTERNAL_DEVICE_IDS } = require('../shared/constants')
const {
  getDeviceBaseExtendedQuery,
  getBasicsForDevicesReport,
  getDeviceByIdBaseQuery,
  getDeviceByDeviceId,
} = require('./common/db')
const { getSelectListFields } = require('./common/querySelectors')
const { getBaseQueryForFactResultsDeviceByTimeFrame } = require('../fact/common/db')
const { getDeviceStatusOverTime } = require('../deviceMaintenanceStatus/service')
const { getDateTimeExpressionInTimeZone } = require('../shared/date')
const { getPartnerWorkingDaysConfig } = require('../partner/common/db')

async function getDeviceByRequest(request) {
  const {
    auth: { credentials },
    params: { deviceId },
  } = request

  return getDeviceByDeviceId({
    deviceId,
    credentials,
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
    query: { showUnapprovedDevices, showDecommissionedDevices, onlyResultDevices },
    auth,
  } = request
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const devicesQuery = knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .modify(
      addConstraints,
      dataConstraints,
      { device: 'd', geography: 'g' },
      { showUnapprovedDevices, showDecommissionedDevices }
    )
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
    plugins: { messageContext },
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

    if (!messageContext.calibrationDateUpdated) {
      messageContext.bindActionCreators({
        calibrationDateUpdated,
      })
    }
    messageContext.calibrationDateUpdated(deviceId)
  }
  // get same 'device' as for Device Details
  device = await getDeviceByDeviceId({
    deviceId,
    credentials,
  })

  return { ok: true, data: device, deviceMaintenanceId }
}

async function getDevicePerformance(request) {
  const { auth, params, query } = request

  const { deviceId } = params

  const dataConstraints = await getConstraints(auth.credentials)

  const endedOn = new Date()

  const startedOn = startOfMonth(subMonths(endedOn, 12)) // 12 months period

  const offset = getTimezoneOffsetFromNumber(query.timezoneOffset)

  const devicePerformance = await knex('Result as r')
    .leftJoin('ResultCategory as rc1', 'rc1.id', 'r.resultCategory1')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .modify(
      addConstraints,
      dataConstraints,
      { result: 'r', device: 'd' },
      { showUnapprovedDevices: true, showDecommissionedDevices: true }
    )
    .where('r.deviceId', deviceId)
    .whereRaw('DATE(r.endedOn) between date(?) and date(?)', [startedOn, endedOn])
    .select([
      knex.raw('count(distinct r.id) as totalResult'), // group by r.endedOn as 'yyyy-MM'
      knex.raw(`sum(rc1.externalId = 'Error') as errorCount`),
      getMonthYearUserTimeZoneField(knex, 'r.endedOn', 'monthTested', offset),
      lastDayOfMonthByOffsetAndResultEndedOn(knex, offset, 'lastDayOfMonth'),
      'd.dailyTestCapacity',
    ])
    .groupBy('monthTested')

  const { errorCategoryId } = await knex('ResultCategory as r')
    .where('r.externalId', 'Error')
    .first('r.id as errorCategoryId')

  const resultsByCategory = await knex('FactResultsDeviceByCategory1 as f')
    .innerJoin('Device as d', 'f.deviceId', 'd.id')
    .innerJoin('Assay as a', 'f.assayId', 'a.id')
    .modify(
      addConstraints,
      dataConstraints,
      { device: 'd', assay: 'a' },
      { showUnapprovedDevices: true, showDecommissionedDevices: true }
    )
    .where('f.days', 365)
    .groupBy('f.resultCategory1')
    .select([knex.raw('f.resultCategory1 as resultCategoryId'), knex.raw(`sum(f.resultCount) as resultCount`)])

  const countryTotalErrorCount = resultsByCategory.find(x => x.resultCategoryId === errorCategoryId)?.resultCount ?? 0
  const countryTotalResult = _.sumBy(resultsByCategory, x => x.resultCount)

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

  let utilizationRateSum = 0

  const newData = devicePerformance.map(dp => {
    if (!dp.dailyTestCapacity) {
      dp.utilizationRate = 0
    } else {
      const minDate = new Date(`${dp.monthTested}-01`)
      const workingDays = getWorkingDays(minDate, dp.lastDayOfMonth)
      const monthlyCapacity = Math.max(workingDays * dp.dailyTestCapacity, 1)
      dp.utilizationRate = Math.round(((dp.totalResult * 100) / monthlyCapacity) * 100) / 100
      if (dp.utilizationRate !== null && !Number.isNaN(dp.utilizationRate)) {
        utilizationRateSum += dp.utilizationRate
      }
    }
    if (dp.totalResult) {
      dp.errorRate = Math.round((dp.errorCount * 100) / dp.totalResult)
      return dp
    }
    dp.errorRate = 0
    return dp
  })

  const utilizationRateAvg = Math.round((utilizationRateSum / devicePerformance.length) * 100) / 100

  return {
    ok: true,
    length: newData.length,
    utilizationRateAvg,
    errorRateAvg: Math.round((countryTotalErrorCount * 100) / countryTotalResult),
    data: _.sortBy(newData, [x => x.monthTested]),
  }
}

// ---------------------------------
// get devices with different aggregations for reports
// ---------------------------------
async function getDevicesForReport(auth, query) {
  const { minDate, maxDate } = query
  if (!minDate || !maxDate) {
    throw Boom.badRequest('Dates are required')
  }

  const dataConstraints = await getConstraints(auth.credentials)
  const { getCount, deviceQuery, resultCategoryIds } = await getBasicsForDevicesReport(dataConstraints, query)
  const userTimeOffset = getOffsetFromIsoDateString(query.maxDate)

  /**
   * base query for list of devices
   */
  const getDevices = deviceQuery
    .clone()
    .modify(sortParams, query, 'name')
    .distinct([
      ..._.filter(getSelectListFields(userTimeOffset), elem => _.isString(elem) && elem.indexOf('dms.') < 0),
      'd.serial',
    ])
  /**
   * get actual list of devices and value `total`
   */
  const [{ count: total }, devices] = await Promise.all([getCount, getDevices])
  /**
   * lists of device id's
   */
  const deviceIds = _.uniq(devices.map(x => x.id))

  const user = await getUserFromCredentials(auth.credentials)
  const { timezoneIANA } = user

  /**
   * base query with all result counts for target device id's
   */
  const results = await getBaseQueryForFactResultsDeviceByTimeFrame(knex, {
    addConstraints,
    dataConstraints,
    filterParams,
    query,
    timeFrame: 'day',
  })
    .whereIn('r.deviceId', deviceIds)
    .groupBy('r.deviceId')
    .select('r.deviceId')
    .sum({
      totalResults: 'r.resultCount',
      totalErrors: knex.raw(`
        case when r.resultCategory1 = ${resultCategoryIds.Error}
        then r.resultCount
        else 0
        end`),
      noResults: knex.raw(`
        case when r.resultCategory1 = ${resultCategoryIds.NoResult}
        then r.resultCount
        else 0
        end`),
      totalInvalid: knex.raw(`
        case when r.resultCategory1 = ${resultCategoryIds.Invalid}
        then r.resultCount
        else 0
        end`),

      totalResults_sameOriginSite: knex.raw(`r.xdrResistanceCounts ->> "$.cntSameOriginSite"`),
      totalErrors_sameOriginSite: knex.raw(`
        case when r.resultCategory1 = ${resultCategoryIds.Error}
        then r.xdrResistanceCounts ->> "$.cntSameOriginSite"
        else 0
        end`),
      noResults_sameOriginSite: knex.raw(`
        case when r.resultCategory1 = ${resultCategoryIds.NoResult}
        then r.xdrResistanceCounts ->> "$.cntSameOriginSite"
        else 0
        end`),
      totalInvalid_sameOriginSite: knex.raw(`
        case when r.resultCategory1 = ${resultCategoryIds.Invalid}
        then r.xdrResistanceCounts ->> "$.cntSameOriginSite"
        else 0
        end`),
    })
  const resultsLastUploaded = await knex('Result as r')
    .modify(addConstraints, dataConstraints, {
      result: 'r',
    })
    .whereIn('r.deviceId', deviceIds)
    /**
     * --> to compare use country timezone with further CONVERT_TZ in getDateTimeProjectionInTimeZoneIANA
     */
    .modify(filterDateRangeParams, query, getDateTimeProjectionInTimeZoneIANA(knex, 'r.endedOn', timezoneIANA))
    .select(
      'r.deviceId',
      /**
       * --> to return use user timezone
       */
      knex.raw(`MAX(CONVERT_TZ(r.updatedOn, "+00:00", "${userTimeOffset}")) as lastUploadOn`)
    )
    .groupBy('r.deviceId')

  /**
   * helper func to calculate percentage
   */
  const getPercentage = (total, value) => {
    return Math.round(100 * (total ? value / total : 0)) / 100
  }
  /**
   * add more fields which depend on aggregations
   */
  const data = devices.map(device => {
    const resultCounts = results.find(x => x.deviceId === device.id) || {}
    const { lastUploadOn } = resultsLastUploaded.find(x => x.deviceId === device.id) || {}
    const it = {
      ...device,
      ..._.omit(resultCounts, ['deviceId']),
      lastUploadOn,
    }
    it.errorRate = getPercentage(it.totalResults, it.totalErrors)
    it.errorRate_sameOriginSite = getPercentage(it.totalResults_sameOriginSite, it.totalErrors_sameOriginSite)
    return it
  })
  const filteredData = data.filter(deviceData => deviceData.totalErrors >= 1)

  return { ok: true, total, length: filteredData.length, data: filteredData }
}

async function getDevicesForRifResistanceReport(auth, query) {
  const assayExternalIds = ['GxMtbRif', 'GxMtbRifUltra']
  const dataConstraints = await getConstraints(auth.credentials)
  const resultCategoryIds = await allResultCategoryToId()
  const deviceQuery = getDeviceBaseExtendedQuery(
    {
      sortCol: 'name',
      sortDir: 'asc',
      hasResults: 1,
      ...query,
    },
    dataConstraints,
    { extendJoinToAssays: true }
  )
    .whereIn('a.externalId', assayExternalIds)
    // Group for avoiding join duplications
    .groupBy(['d.id'])

  /**
   *
   */
  const baseFields = ['st.name as state', 'd.id as deviceId', 'd.name', 'lg.name as county']
  query.assay = assayExternalIds

  const allCounts = await getBaseQueryForFactResultsDeviceByTimeFrame(knex, {
    addConstraints,
    dataConstraints,
    filterParams,
    query,
    timeFrame: 'day',
  })
    .where('rca.reportable', true)
    .select(baseFields)
    .groupBy('r.deviceId')
    .sum({
      totalResults: 'r.resultCount',
      totalDetected1: knex.raw(`
        case
        when r.resultCategory1 = ${resultCategoryIds.Detected} then r.resultCount
        else 0
        end
      `),
      totalDetected2: knex.raw(`
        case
        when r.resultCategory2 = ${resultCategoryIds.Detected} then r.resultCount
        else 0
        end
      `),
    })

  const allDevices = await deviceQuery.clone().select(baseFields).orderBy('d.name')
  const data = _.map(allDevices, d => {
    const item = allCounts.find(it => it.deviceId === d.deviceId)
    return {
      ...d,
      totalResults: item?.totalResults || 0,
      totalDetected1: item?.totalDetected1 || 0,
      totalDetected2: item?.totalDetected2 || 0,
    }
  })
  const total = data.length

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

const getDeviceMaintenanceStatusesInRange = async (deviceId, dateFrom, dateTo) =>
  knex('DeviceMaintenanceStatusLog as dmsl')
    .where({ deviceId })
    .innerJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
    .andWhere('day', '>=', dateFrom)
    .andWhere('day', '<=', dateTo)
    .distinct('dms.externalId')
    .pluck('dms.externalId')

const getDeviceResultCount = (deviceId, dateFrom, dateTo, timezoneIANA) => {
  const minDateFormat = "yyyy-MM-dd'T'00:00:00.000'Z'"
  const maxDateFormat = "yyyy-MM-dd'T'23:59:59.999'Z'"
  return knex('Result as r')
    .leftJoin('Device as d', 'r.deviceId', 'd.id')
    .where('d.id', deviceId)
    .where(
      getDateTimeExpressionInTimeZone(knex, 'r.endedOn', timezoneIANA),
      '>=',
      knex.raw(`'${format(dateFrom, minDateFormat)}'`)
    )
    .where(
      getDateTimeExpressionInTimeZone(knex, 'r.endedOn', timezoneIANA),
      '<=',
      knex.raw(`'${format(dateTo, maxDateFormat)}'`)
    )
    .count('r.id as resultCount')
    .first()
}

async function setStatusForDateRange(request) {
  const {
    auth: { credentials },
    params: { deviceId },
    payload,
    plugins: { messageContext },
  } = request
  const { externalId, day = startOfTodayUtc(), notes, expectedBackOnline } = payload
  let { parentQuery } = payload
  let { dateFrom, dateTo } = payload

  if (!dateFrom && !dateTo) {
    dateFrom = day
    dateTo = day
  }

  /**
   * in case if `parentQuery` is missing - get minDate/maxDate for current month from dateFrom/dateTo.
   * --> `parentQuery` is a `query` used in getDeviceStatusOverTime() func
   * for `Overall Network Health Daily` component.
   */
  if (!parentQuery) {
    parentQuery = {
      minDate: startOfMonth(dateFrom),
      maxDate: endOfMonth(dateTo),
    }
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
    else if (statusesInDateRange.includes('active')) {
      const { resultCount } = await getDeviceResultCount(deviceId, dateFrom, dateTo, user.timezoneIANA)
      if (resultCount > 0) throw Boom.badRequest('You cannot change the status of a device in days when it was active')
    } else if (externalId === 'inactiveDecommissioned')
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
    expectedBackOnline,
  }

  // Everything all right, then insert logs
  if (notes) {
    _.set(payload, 'options.data.notes', notes)
  }
  if (expectedBackOnline) {
    _.set(payload, 'options.data.expectedBackOnline', expectedBackOnline)
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

  /**
   * Get all days for current device in current month.
   * --> Call same func which is used for getting data for
   * `Overall Network Health Daily`, but here get data
   * for current device only
   */
  const deviceStatusOverTime = await getDeviceStatusOverTime(request.auth, parentQuery, [deviceId])
  data.deviceData = deviceStatusOverTime.find(it => it.id === deviceId)

  return {
    ok: true,
    data,
  }
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

    const deviceMaintenanceData = await knex('DeviceMaintenanceStatusLog as dmsl')
      .join('Device as d', 'dmsl.deviceId', 'd.id')
      .where('dmsl.deviceId', qb => {
        qb.select('deviceId').from('DeviceMaintenanceStatusLog').where('id', deviceMaintenanceStatusLogId)
      })
      .orderByRaw('dmsl.day desc, dmsl.createdOn desc, dmsl.id desc')
      .first(
        'dmsl.deviceId',
        'dmsl.id as latestDeviceMaintenanceStatusLogId',
        'd.deviceMaintenanceStatusLogId as currentDeviceMaintenanceStatusLogId'
      )

    if (!deviceMaintenanceData) return

    const { deviceId, latestDeviceMaintenanceStatusLogId, currentDeviceMaintenanceStatusLogId } = deviceMaintenanceData

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
    return automaticallySetDeviceMaintenanceStatus(deviceId, startOfTodayUtc(), 'active', action, messageContext)
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
  const customWorkingDaysConfig = await getPartnerWorkingDaysConfig(auth)

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
          isWeekend: isWeekend(day, customWorkingDaysConfig),
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
      .modify(
        addConstraints,
        dataConstraints,
        {
          device: 'd',
        },
        { showUnapprovedDevices: true, showDecommissionedDevices: true }
      )
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
 * @param {*} timezone Timezone of current country
 * @returns
 */
async function getDevicesMaintenanceLogForTheDay(knex, today, timezone) {
  const devicesBase = knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .where('dtc.hasResults', 1)

  /**
   * total results today for all devices.
   * Notice that we shift endedOn and startedOn dates to the country timezone with CONVERT_TZ directly,
   * without using helper getDateTimeProjectionInTimeZoneIANA because here we wrap it with DATE() func
   */
  const allResults = await devicesBase
    .clone()
    .leftJoin('Result as r', 'd.id', 'r.deviceId')
    .where(function () {
      this.where(knex.raw(`DATE(CONVERT_TZ(r.endedOn, "+00:00", "${timezone}"))`), knex.raw('DATE(?)', today)).orWhere(
        function () {
          this.whereNull(`r.endedOn`).andWhere(
            knex.raw(`DATE(CONVERT_TZ(r.startedOn, "+00:00", "${timezone}"))`),
            knex.raw(`DATE(?)`, today)
          )
        }
      )
    })
    .groupBy('d.id')
    .select('d.id', knex.raw('COUNT(r.id) as totalResults'))

  /**
   * all devices
   */
  const allDevices = await devicesBase
    .clone()
    .leftJoin('DeviceMaintenanceStatusLog as current_dmsl', 'd.deviceMaintenanceStatusLogId', 'current_dmsl.id')
    .leftJoin('DeviceMaintenanceStatus as current_dms', 'current_dmsl.deviceMaintenanceStatusId', 'current_dms.id')
    .leftJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .select(
      'd.id',
      'current_dms.externalId as currentMaintenanceStatusExternalId',
      'current_dms.active as currentMaintenanceStatusActive',
      'current_dmsl.data as currentMaintenanceStatusLogData',
      'current_dmsl.day as currentMaintenanceStatusDay',
      'da.token as approvalToken',
      'd.deviceApprovalId as deviceApprovalId'
    )

  /**
   * all devices with latest entry from DeviceMaintenanceStatusLog for today
   */
  const allDevicesToday = await devicesBase
    .clone()
    /**
     * use 2 left joins for the same table with special conditions to get the latest entry for `today_dmsl`
     * for each device/day
     */
    .leftJoin('DeviceMaintenanceStatusLog as today_dmsl', queryBuilder => {
      queryBuilder.on('d.id', 'today_dmsl.deviceId').andOn('today_dmsl.day', knex.raw('DATE(?)', [today]))
    })
    .leftJoin('DeviceMaintenanceStatusLog as today_dmsl_next', function () {
      this.on('today_dmsl.deviceId', 'today_dmsl_next.deviceId')
        .andOn('today_dmsl.day', 'today_dmsl_next.day')
        .andOn(function () {
          this.on('today_dmsl.createdOn', '<', 'today_dmsl_next.createdOn').orOn(function () {
            this.on('today_dmsl.createdOn', 'today_dmsl_next.createdOn').andOn(
              'today_dmsl.id',
              '<',
              'today_dmsl_next.id'
            )
          })
        })
    })
    .leftJoin('DeviceMaintenanceStatus as today_dms', 'today_dmsl.deviceMaintenanceStatusId', 'today_dms.id')
    /**
     * mandatory condition to get latest `today_dmsl` entry in above `left join`
     */
    .whereNull('today_dmsl_next.id')
    .select(
      'd.id',
      'today_dms.externalId as todayMaintenanceStatusExternalId',
      'today_dms.active as todayMaintenanceStatusActive',
      'today_dmsl.id as today_dmsl_id',
      'today_dmsl.data as todayMaintenanceStatusLogData',
      'today_dmsl.day as todayMaintenanceStatusDay'
    )

  /**
   * Notice that `allDevices` and `allDevicesToday` contain same number of devices,
   * i.e. all devices from Device table where deviceTypeCategory allow results (dtc.hasResults = 1).
   */

  /**
   * prepare data to return
   */
  const data = _.reduce(
    allDevices,
    (acc, device) => {
      const deviceToday = allDevicesToday.find(it => it.id === device.id)
      const totalResults = allResults.find(it => it.id === device.id)?.totalResults || 0
      if (
        /**
         * Return data if the device's log does not exist for the given day
         * --> REASON: We need to add the missing log
         */
        !deviceToday?.today_dmsl_id ||
        /**
         * Return data if the device is decommissioned but the log is not set to inactiveDecommissioned
         * --> REASON: We need to set the maintenance as 'inactiveDecommissioned' if decommission
         * happened before 'today'.
         * TODO: compare only decommissioned if the approval status decommissioned was set before the given
         * day (we need to change relationships, from device-deviceApprovalStatus to device-deviceApprovalLog)
         */
        (device.approvalToken === 'decommissioned' &&
          deviceToday.todayMaintenanceStatusExternalId !== 'inactiveDecommissioned') ||
        /**
         * Return data if the device has a log for the given day, which is set to 'inactiveUnknown'
         * --> REASON: We'll check if the device has future results, and set the current
         * log to 'inactiveNoTestsPerformed' if that is true
         */
        deviceToday.todayMaintenanceStatusExternalId === 'inactiveUnknown'
      ) {
        acc = [...acc, { ...device, ...deviceToday, totalResults }]
      }
      return acc
    },
    []
  )

  return data
}

async function onDeviceMaintenanceStatusLogScheduled(action, { messageContext }) {
  return messageContext.run(async knex => {
    /**
     * get timezone from TimeZone table for 1st country.
     * Notice that here we use same field alias `timezoneIANA` as in
     * `api/src/auth/service.js` for getting current user details.
     */
    const { timezoneIANA: timezone } = await knex('Country as c')
      .leftJoin('TimeZone as tz', 'tz.id', 'c.timezone')
      .orderBy('c.id')
      .first('tz.timeZone as timezoneIANA')
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
    const devicesMaintenanceLogForTheDay = await getDevicesMaintenanceLogForTheDay(knex, today, timezone)

    await Promise.each(devicesMaintenanceLogForTheDay, async device => {
      const {
        id,
        approvalToken,
        currentMaintenanceStatusExternalId,
        currentMaintenanceStatusLogData = '{}',
        currentMaintenanceStatusDay,
        currentMaintenanceStatusActive,
        todayMaintenanceStatusExternalId,
        totalResults,
      } = device

      // set maintenance status external id
      let deviceMaintenanceStatusForTheDay
      /**
       * If today is after the current log day,
       * and the last log was one of the inactive statuses,
       * then assume that the reason of inactivity is the same than before.
       */
      if (
        currentMaintenanceStatusExternalId &&
        today > currentMaintenanceStatusDay &&
        !currentMaintenanceStatusActive
      ) {
        deviceMaintenanceStatusForTheDay = currentMaintenanceStatusExternalId
      } else {
        /**
         * Else, as we don't know the reason of inactivity, 'inactiveUnknown' will be set as default
         */
        deviceMaintenanceStatusForTheDay = 'inactiveUnknown'
      }
      /**
       * If the device is currently decommissioned, we need to check if that is the reason of inactivity
       */
      if (approvalToken === 'decommissioned') {
        /**
         * If the device's last approval log is 'inactiveDecommissioned', and the day to process is after that approval log,
         * then we can assume the device inactivity reason is that it was decommissioned and no longer working
         * */
        const lastDeviceApprovalLog = await knex('DeviceApprovalLog')
          .where({ deviceId: id })
          .orderBy('createdOn', 'desc')
          .first()

        if (lastDeviceApprovalLog) {
          const { createdOn: lastApprovalDate } = lastDeviceApprovalLog
          if (lastApprovalDate <= today) {
            deviceMaintenanceStatusForTheDay = 'inactiveDecommissioned'
          } else {
            /**
             * treat `active` if there are results for the day, or use
             * todayMaintenanceStatusExternalId with default deviceMaintenanceStatusForTheDay
             */
            deviceMaintenanceStatusForTheDay =
              totalResults > 0 ? 'active' : todayMaintenanceStatusExternalId || deviceMaintenanceStatusForTheDay
          }
        } else {
          deviceMaintenanceStatusForTheDay = 'inactiveDecommissioned'
        }
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

        if (totalFutureResults > 0) {
          // If has newer results, then we know that the device didn't performed tests in the day
          deviceMaintenanceStatusForTheDay = 'inactiveNoTestsPerformed'
        }
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

async function onDeviceUpdateModuleSerials(action, { messageContext }) {
  return messageContext.run(async knex => {
    const items = await knex('Device as d')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
      .where('dtc.hasResults', 1)
      .select('d.id as deviceId')
    return Promise.each(items, async ({ deviceId }) => updateDeviceConfigurationData(knex, deviceId))
  })
}

/**
 *
 */
async function updateDeviceConfigurationData(knex, deviceId) {
  let { configurationData } = await knex('Device').where({ id: deviceId }).first('configurationData')
  configurationData = configurationData ? JSON.parse(configurationData) : {}

  const data = await knex('Result as r')
    .join('ResultType as rt', 'rt.id', 'r.resultTypeId')
    .where({ deviceId })
    .where('rt.excluded', false)
    .distinct('r.moduleSerial')
    .orderBy('r.moduleSerial')
  const moduleSerials = data.map(it => it.moduleSerial)
  /**
   * exit if new `moduleSerials` equals existing one
   */
  if (_.isEqual(moduleSerials, configurationData.moduleSerials)) {
    return
  }
  /**
   * save new `moduleSerials`
   */
  _.set(configurationData, 'moduleSerials', moduleSerials)
  await knex('Device')
    .where({ id: deviceId })
    .update({ configurationData: JSON.stringify(configurationData) })
}

module.exports = {
  showDevice,
  getDeviceByRequest,
  listApprovalTypes,
  listMaintenanceStatuses,
  listDevicesForSelectList,
  getDevice,
  updateDeviceMaintenance,
  getDevicePerformance,
  getDevicesForReport,
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
  getDeviceBaseExtendedQuery,
  setStatusForDateRange,
  postPayloadFromDevice,
  onDeviceUpdateModuleSerials,
}
