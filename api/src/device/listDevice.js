const _ = require('lodash')
const { subMonths, endOfMonth, startOfMonth } = require('date-fns')
const { utcToZonedTime, zonedTimeToUtc } = require('date-fns-tz')
const { getAccountDetailsForUsername } = require('../accountDetails/service')
const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { resultCategoryToId } = require('../shared/dictionary')
const { INTERNAL_DEVICE_IDS } = require('../shared/constants')
const { getSelectListFields } = require('./common/querySelectors')
const { convertTimezonetoIANA } = require('../shared/date')

async function getListDevices(query, auth) {
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)
  const loggedUserName = auth.credentials.name
  const accountDetails = await getAccountDetailsForUsername(loggedUserName)
  const resultCategoryErrorId = await resultCategoryToId('Error')
  const { assayId } = query
  /**
   * `assayId` is number or array of numbers - cuz try(Joi.array().items(Joi.number()), Joi.number())
   */
  const assayFilter = assayId ? (_.isArray(assayId) ? assayId : [assayId]) : null
  const deviceQuery = knex('Device as d')
    .innerJoin('Partner as p', 'd.partnerId', 'p.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin(
      knex('FactResultsDeviceByAssay as fact')
        .where('fact.days', 30)
        .modify(filter => {
          if (assayFilter) filter.whereIn('fact.assayId', assayFilter)
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
          if (assayFilter) filter.whereIn('fact.assayId', assayFilter)
        })
        .groupBy('deviceId')
        .select('fact.deviceId', knex.raw('sum(resultCount) as resultCount'))
        .as('frd60'),
      'frd60.deviceId',
      'd.id'
    )
    .leftJoin(
      knex('FactResultsDeviceByCategory1 as fact')
        .where('fact.days', 30)
        .where('fact.resultCategory1', resultCategoryErrorId)
        .modify(filter => {
          if (assayFilter) filter.whereIn('fact.assayId', assayFilter)
        })
        .groupBy('fact.deviceId')
        .select('fact.deviceId', knex.raw('sum(fact.resultCount) as resultCount'))
        .as('frd30Errors'),
      'frd30Errors.deviceId',
      'd.id'
    )
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
    .modify(
      addConstraints,
      dataConstraints,
      {
        partner: 'p',
        assay: 'a',
        device: 'd',
        deviceType: 'dt',
        geography: 'g',
        site: 's',
        disease: 'dis',
      },
      { showUnapprovedDevices: true, showDecommissionedDevices: true }
    )
  // get total count for paging
  const getCount = deviceQuery.clone().countDistinct('d.id as count').first()
  const userTimeOffset = '+00:00' // TODO: get time offset from somewhere and put here, as there is no datetime parameter to use getOffsetFromIsoDateString(someIsoDateParam) here.

  const timezone = convertTimezonetoIANA(accountDetails.timezone || 'UTC')
  const now = utcToZonedTime(new Date(), timezone)
  const previousMonth = subMonths(now, 1)
  const maxCurrentDate = zonedTimeToUtc(endOfMonth(now), timezone)
  const minCurrentDate = zonedTimeToUtc(startOfMonth(now), timezone)
  const maxPreviousDate = zonedTimeToUtc(endOfMonth(previousMonth), timezone)
  const minPreviousDate = zonedTimeToUtc(startOfMonth(previousMonth), timezone)

  // get rows
  const getItems = deviceQuery
    .clone()
    .leftJoin(
      knex('Result as resDevice')
        .select({
          deviceId: 'deviceId',
          lastResultConductedOn: knex.raw('MAX(resDevice.endedOn)'),
          totalCurrentMonth: knex.raw(`SUM(CASE WHEN resDevice.endedOn BETWEEN ? AND ? THEN 1 ELSE 0 END)`, [
            minCurrentDate,
            maxCurrentDate,
          ]),
          totalPreviousMonth: knex.raw(`SUM(CASE WHEN resDevice.endedOn BETWEEN ? AND ? THEN 1 ELSE 0 END)`, [
            minPreviousDate,
            maxPreviousDate,
          ]),
        })
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
      ...getSelectListFields(userTimeOffset),
      'deviceResult.totalCurrentMonth as resultCountThisMonth', // 'frd30.resultCount as resultCountThisMonth',
      'deviceResult.totalPreviousMonth as resultCountLastMonth', // knex.raw('frd60.resultCount - frd30.resultCount as resultCountLastMonth'),
      'frd30Errors.resultCount as thisMonthErrors',
      knex.raw('count(distinct dmslActivity.day) as totalDays'),
      knex.raw('count(distinct case when dmslActivity.active = 1 then dmslActivity.day else null end) as activeDays'),
      'issues.categories as issueCategories',
      'dms.active as isDeviceActive',
      'dmsl.day as dmslDay',
      // Connector is considered online if it did a connection since the start of the previous day
      knex.raw(
        'CASE WHEN d.lastPingOn > DATE(DATE_ADD(NOW(), INTERVAL -1 DAY)) THEN "online" ELSE "offline" END AS connectorStatus'
      ),
      knex.raw('d.ConfigurationData ->> "$.gxConnectVersion" AS connectorVersion'),
      knex.raw('deviceResult.lastResultConductedOn AS lastResultConductedOn'),
      // If the device last maintenance status log was registered since the start of yesterday, then...
      //  Is considered up if the last maintenance log was active, reported active, or no tests performed
      //  Is considered unknown if the last maintenance log was unknown
      //  Is considered down if the last maintenance log is any other (all statuses representing inactivity)
      // ...else, it's considered notRecorded because we didn't register a status since the day previous yesterday
      knex.raw(`
        CASE WHEN dmsl.day >= DATE(DATE_ADD(now(), INTERVAL -1 DAY)) THEN
          CASE 
            WHEN dms.externalId IN ('active', 'reportedActive', 'inactiveNoTestsPerformed') THEN 'up'
            WHEN dms.externalId IN ('inactiveUnknown') THEN 'unknown'
            ELSE 'down' END
          ELSE 'notRecorded'
        END AS 'deviceStatus'`),
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
async function listDevice(request) {
  const { query, auth } = request

  // get dataset for current query params (sorting, filtering and pagination) and auth constraints

  const result = await getListDevices(query, auth)

  return result
}

module.exports = {
  listDevice,
}
