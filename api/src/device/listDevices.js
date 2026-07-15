const _ = require('lodash')
const { subMonths } = require('date-fns')
const { getUtcMonthBoundariesInTimezone, getUtcDayBoundariesInTimezone } = require('../shared/date')
const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { resultCategoryToId } = require('../shared/dictionary')
const { INTERNAL_DEVICE_IDS } = require('../shared/constants')
const { getSelectListFields } = require('./common/querySelectors')
const { getUser } = require('../auth/service')

async function getListDevices(query, auth) {
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)
  const { timezoneIANA, personTimezoneIANA } = await getUser(auth.credentials.name)
  const resultCategoryErrorId = await resultCategoryToId('Error')
  const { assayId, geneXpertType } = query
  /**
   * `assayId` is number or array of numbers - cuz try(Joi.array().items(Joi.number()), Joi.number())
   */
  const assayFilter = assayId ? (_.isArray(assayId) ? assayId : [assayId]) : null
  const deviceQuery = knex('Device as d')
    .innerJoin('Partner as p', 'd.partnerId', 'p.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .leftJoin('Site as s', 'd.siteId', 's.id')
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
      if (query.connectorStatus && !query.connectorStatus?.includes('all')) {
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
      if (geneXpertType === '6cModules') queryBuilder.where('d.gx6cModulesCount', '>', 0)
      if (geneXpertType === '10cModules') queryBuilder.where('d.gx10cModulesCount', '>', 0)
    })
    .modify(filterParams, query, {
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      deviceName: 'd.name',
      deviceApprovalId: 'd.deviceApprovalId',
      deviceApprovalExternalId: 'da.token',
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
      { deviceApprovals: ['approved', 'pendingDeployment', 'decommissioned'] }
    )

  const now = new Date()

  // Compute month and day boundaries as UTC equivalents of local calendar boundaries in the
  // country timezone. This avoids CONVERT_TZ on every Result row in SQL, allowing the DB to
  // compare the raw UTC column directly and use the (deviceId, endedOn) index.
  const { start: minCurrentDate, end: maxCurrentDate } = getUtcMonthBoundariesInTimezone(now, timezoneIANA)
  const { start: minPreviousDate, end: maxPreviousDate } = getUtcMonthBoundariesInTimezone(
    subMonths(now, 1),
    timezoneIANA
  )
  const { start: currentDayStart, end: currentDayEnd } = getUtcDayBoundariesInTimezone(now, timezoneIANA)

  // get rows
  const getItems = deviceQuery
    .clone()
    .leftJoin(
      // Bounded to the previous month start so the DB uses the (deviceId, endedOn) index
      // as a range scan (~2 months of rows) instead of a full table scan.
      // CONVERT_TZ is intentionally absent: boundaries are pre-shifted to UTC in JS via
      // getUtcMonthBoundariesInTimezone / getUtcDayBoundariesInTimezone so the raw column
      // can be compared directly.
      knex('Result as resDevice')
        .where('resDevice.endedOn', '>=', minPreviousDate)
        .select({
          deviceId: 'deviceId',
          totalCurrentMonth: knex.raw(`SUM(CASE WHEN resDevice.endedOn BETWEEN ? AND ? THEN 1 ELSE 0 END)`, [
            minCurrentDate,
            maxCurrentDate,
          ]),
          totalPreviousMonth: knex.raw(`SUM(CASE WHEN resDevice.endedOn BETWEEN ? AND ? THEN 1 ELSE 0 END)`, [
            minPreviousDate,
            maxPreviousDate,
          ]),
          totalCurrentDay: knex.raw(`SUM(CASE WHEN resDevice.endedOn BETWEEN ? AND ? THEN 1 ELSE 0 END)`, [
            currentDayStart,
            currentDayEnd,
          ]),
        })
        .groupBy('deviceId')
        .as('deviceResult'),
      'd.id',
      'deviceResult.deviceId'
    )
    .leftJoin(
      // Separate unbounded subquery for the all-time last result date.
      // Kept apart from the counts subquery so it doesn't prevent the range scan above.
      // TODO (Solution G): move this to a stored column on Device updated on result insert
      //   to eliminate this scan entirely.
      knex('Result as resLastResult')
        .select({
          deviceId: 'deviceId',
          lastResultConductedOn: knex.raw('MAX(resLastResult.endedOn)'),
        })
        .groupBy('deviceId')
        .as('deviceLastResult'),
      'd.id',
      'deviceLastResult.deviceId'
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
    .modify(queryBuilder => {
      if (query.deviceMaintenanceStatusId && !_.isEmpty(query.deviceMaintenanceStatusId)) {
        queryBuilder.whereIn('dms.externalId', query.deviceMaintenanceStatusId)

        if (query.deviceMaintenanceStatusId.includes('active')) {
          queryBuilder.andWhere('deviceResult.totalCurrentDay', '>', 0)
        }
        if (query.deviceMaintenanceStatusId.includes('inactiveUnknown')) {
          queryBuilder.orWhere('dms.externalId', 'active').andWhere('deviceResult.totalCurrentDay', 0)
        }
      }
    })

  const getDevices = getItems
    .clone()
    .modify(sortPageParams, query, 'name')
    .groupBy('d.id')
    .select([
      /**
       * --> to return use user timezone
       */
      ...getSelectListFields(personTimezoneIANA),
      // The lastPingOn and createdOn fields from the getSelectListFields function are adjusted to UTC by accounting for the user's timezone offset.
      // These UTC values are then used in reports and are sent separately for further processing.
      'd.lastPingOn as lastPingInUtc',
      'd.createdOn as createdOnInUtc',
      'deviceResult.totalCurrentMonth as resultCountThisMonth',
      'deviceResult.totalPreviousMonth as resultCountLastMonth',
      knex.raw(`
       CASE
         WHEN dmsl.day >= DATE(DATE_ADD(NOW(), INTERVAL -1 DAY)) THEN
           CASE
             WHEN deviceResult.totalCurrentDay = 0 AND dms.externalId = 'active' THEN 'inactiveUnknown'
             ELSE dms.i18nKey
           END
         ELSE NULL
       END AS maintenanceStatusI18nKey`),
      'frd30Errors.resultCount as thisMonthErrors',
      knex.raw('count(distinct dmslActivity.day) as totalDays'),
      knex.raw('count(distinct case when dmslActivity.active = 1 then dmslActivity.day else null end) as activeDays'),
      'dms.active as isDeviceActive',
      'dmsl.day as dmslDay',
      // Connector is considered online if it did a connection since the start of the previous day
      knex.raw(
        'CASE WHEN d.lastPingOn > DATE(DATE_ADD(NOW(), INTERVAL -1 DAY)) THEN "online" ELSE "offline" END AS connectorStatus'
      ),
      knex.raw('d.ConfigurationData ->> "$.gxConnectVersion" AS connectorVersion'),
      knex.raw('deviceLastResult.lastResultConductedOn AS lastResultConductedOn'),
      // If the device last maintenance status log was registered since the start of yesterday, then...
      //  Is considered up if the last maintenance log was active, reported active, or no tests performed
      //  Is considered unknown if the last maintenance log was unknown
      //  Is considered down if the last maintenance log is any other (all statuses representing inactivity)
      // ...else, it's considered notRecorded because we didn't register a status since the day previous yesterday
      knex.raw(`
        CASE WHEN dmsl.day >= DATE(DATE_ADD(now(), INTERVAL -1 DAY)) THEN
          CASE
            WHEN dms.externalId = 'active' AND deviceResult.totalCurrentDay = 0 THEN 'unknown'
            WHEN dms.externalId IN ('active', 'reportedActive', 'inactiveNoTestsPerformed') THEN 'up'
            WHEN dms.externalId IN ('inactiveUnknown') THEN 'unknown'
            ELSE 'down' END
          ELSE 'notRecorded'
        END AS 'deviceStatus'`),
    ])
    .distinct()

  const getCount = getItems.clone().countDistinct('d.id as count').first()

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getDevices])

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

    it.timezoneIANA = timezoneIANA
    delete it.dmslDay
    delete it.deviceLastSeenOn
    delete it.isDeviceActive
  })

  return { ok: true, total, length: data.length, data }
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

module.exports = {
  listDevices,
}
