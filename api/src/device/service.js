const _ = require('lodash')
const Boom = require('@hapi/boom')
const Promise = require('bluebird')
const {
  addDays,
  addYears,
  subMonths,
  startOfMonth,
  endOfMonth,
  format,
  isWeekend,
  parseJSON,
  differenceInBusinessDays,
} = require('date-fns')
const { deviceMaintenanceStatusLogged, calibrationDateUpdated } = require('./actions')
const { knex, filterParams, filterDateRangeParams, sortPageParams, transact } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
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
    .modify(addConstraints, dataConstraints, { device: 'd', geography: 'g' }, { showUnapprovedDevices })
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
    .modify(addConstraints, dataConstraints, { result: 'r', device: 'd' }, { showUnapprovedDevices: true })
    .where('r.deviceId', deviceId)
    .whereRaw('DATE(r.endedOn) between date(?) and date(?)', [startedOn, endedOn])
    .select([
      knex.raw('count(distinct r.id) as totalResult'), // group by r.endedOn as 'yyyy-MM'
      knex.raw(`sum(rc1.externalId = 'Error') as errorCount`),
      getMonthYearUserTimeZoneField(knex, 'r.endedOn', 'monthTested', offset),
      lastDayOfMonthByOffsetAndResultEndedOn(knex, offset, 'lastDayOfMonth'),
    ])
    .groupBy('monthTested')

  const { errorCategoryId } = await knex('ResultCategory as r')
    .where('r.externalId', 'Error')
    .first('r.id as errorCategoryId')

  const resultsByCategory = await knex('FactResultsDeviceByCategory1 as f')
    .innerJoin('Device as d', 'f.deviceId', 'd.id')
    .innerJoin('Assay as a', 'f.assayId', 'a.id')
    .modify(addConstraints, dataConstraints, { device: 'd', assay: 'a' })
    .where('f.days', 365)
    .groupBy('f.resultCategory1')
    .select([knex.raw('f.resultCategory1 as resultCategoryId'), knex.raw(`sum(f.resultCount) as resultCount`)])

  const countryTotalErrorCount = resultsByCategory.find(x => x.resultCategoryId === errorCategoryId)?.resultCount ?? 0
  const countryTotalResult = _.sumBy(resultsByCategory, x => x.resultCount)

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

      const minDate = new Date(`${x.monthTested}-01`)
      const workingDays = differenceInBusinessDays(x.lastDayOfMonth, minDate)
      x.utilizationRate = _.round((x.totalResult * 100) / Math.max(workingDays * deviceCapacity.dailyCapacity, 1), 2)
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

// ---------------------------------
// get devices with different aggregations for reports
// ---------------------------------
async function getDevicesForReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { getCount, deviceQuery, resultCategoryIds } = await getBasicsForDevicesReport(dataConstraints, query)
  const userTimeOffset = getOffsetFromIsoDateString(query.maxDate)

  /**
   * base query for list of devices
   */
  const getDevices = deviceQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .distinct([
      ..._.filter(getSelectListFields(userTimeOffset), elem => _.isString(elem) && elem.indexOf('dms.') < 0),
      'd.serial',
      'd.siteId',
    ])
  /**
   * get actual list of devices and value `total`
   */
  const [{ count: total }, dataRaw] = await Promise.all([getCount, getDevices])
  /**
   * lists of device id's and site id's
   */
  const deviceIds = _.uniq(dataRaw.map(x => x.id))
  const siteIds = _.uniq(dataRaw.map(x => x.siteId)).join(',')
  /**
   * base query with all result counts for target device id's and site id's
   */
  const queryResults = knex('Result as r')
    .leftJoin('Sample as sa', 'r.sampleId', 'sa.id')
    .modify(addConstraints, dataConstraints, {
      result: 'r',
      sample: 'sa',
    })
    .whereIn('r.deviceId', deviceIds)
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .select(
      'r.deviceId',
      /**
       * old way to get lastUploadOn was via ResultWorkflowLog.changedOn
       */
      knex.raw('MAX(r.updatedOn) as lastUploadOn')
    )
    .groupBy('r.deviceId')
    .count({
      totalResults: knex.raw('DISTINCT r.id'),
      totalErrors: knex.raw(`DISTINCT CASE WHEN r.resultCategory1 = ? THEN r.id ELSE null END`, [
        resultCategoryIds.Error,
      ]),
      totalInvalid: knex.raw(`DISTINCT CASE WHEN r.resultCategory1 = ? THEN r.id ELSE null END`, [
        resultCategoryIds.Invalid,
      ]),
      totalResults_sameOriginSite: knex.raw(
        `DISTINCT
        CASE WHEN sa.originSiteId IN (${siteIds}) THEN r.id ELSE null END`
      ),
      totalErrors_sameOriginSite: knex.raw(
        `DISTINCT
        CASE
        WHEN sa.originSiteId IN (${siteIds}) and r.resultCategory1 = ?
        THEN r.id ELSE null
        END`,
        [resultCategoryIds.Error]
      ),
      totalInvalid_sameOriginSite: knex.raw(
        `DISTINCT
        CASE
        WHEN sa.originSiteId IN (${siteIds}) and r.resultCategory1 = ?
        THEN r.id ELSE null
        END`,
        [resultCategoryIds.Invalid]
      ),
    })
  const results = await queryResults

  /**
   * helper func to calculate percentage
   */
  const getPercentage = (total, value) => {
    return Math.round(100 * (total ? value / total : 0)) / 100
  }
  /**
   * add more fields which depend on aggregations
   */
  const data = dataRaw.map(device => {
    const resultCounts = results.find(x => x.deviceId === device.id) || {}
    const it = {
      ...device,
      ..._.omit(resultCounts, ['deviceId']),
    }
    it.errorRate = getPercentage(it.totalResults, it.totalErrors)
    it.errorRate_sameOriginSite = getPercentage(it.totalResults_sameOriginSite, it.totalErrors_sameOriginSite)
    return it
  })

  return { ok: true, total, length: data.length, data }
}

async function getDevicesForRifResistanceReport(auth, query) {
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
  const { externalId, day = startOfTodayUtc(), notes, expectedBackOnline } = payload
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
    expectedBackOnline,
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
    if (expectedBackOnline) {
      _.set(payload, 'options.data.expectedBackOnline', expectedBackOnline)
      delete payload.expectedBackOnline
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
         * then we can assume the device inactivty reason is that it was decommissioned and no longer working
         * */
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
  const deviceQuery = getDeviceBaseExtendedQuery(query, dataConstraints, { extendJoinToAssays: true })
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
    .distinct([
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
  getDeviceCalibrationsForReport,
  getDeviceBaseExtendedQuery,
  setStatusForDateRange,
  postPayloadFromDevice,
  onDeviceUpdateModuleSerials,
}
