const _ = require('lodash')
const subMonths = require('date-fns/subMonths')
const { knex, filterParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getOffsetFromIsoDateString, startOfMonthUTC, endOfMonthUTC } = require('../shared/date')

const { allResultCategoryToId, allMessageStatusToId } = require('../shared/dictionary')
const { formatDateOrDefault } = require('../shared/date')

const getPositiveCategoriesExternalIds = require('../resultCategory/service')

async function getAssayQuery(query, dataConstraints, positiveResultCategories) {
  return knex('Assay as a')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .innerJoin('ResultCategoryAssay as rca', 'a.id', 'rca.assayId')
    .innerJoin('ResultCategory as rcPositive', function () {
      this.on('rca.resultCategoryId', 'rcPositive.id').andOn(knex.raw(`rcPositive.id IN (${positiveResultCategories})`))
    })
    .leftJoin('Disease as d', 'at.diseaseId', 'd.id')
    .innerJoin('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
    .modify(addConstraints, dataConstraints, {
      assayType: 'at',
      assay: 'a',
      deviceType: 'dt',
      disease: 'd',
    })
    .modify(filterParams, query, { name: 'a.name' })
    .select(
      'a.id as assayId',
      'a.name as assayName',
      'a.externalId as assayExternalId',
      'a.i18nKey as assayI18nKey',
      knex.raw('MAX(rcPositive.id) as resultCategoryPositiveId')
    )
    .whereIn('a.id', knex('Result').select('assayId').distinct())
    .where('a.externalId', '!=', 'GxUnknown')
    .whereNot('dt.externalId', 'GxAlert')
    .orderBy('a.name')
    .groupBy('a.id', 'a.name', 'a.externalId', 'a.i18nKey')
}

async function getResultQuery(query, dataConstraints, positiveResultCategories, tz = '+00:00') {
  const { currentMonth = new Date() } = query
  const messageStatusToId = await allMessageStatusToId()

  /**
   * base query which contains all required conditions and joins
   */
  const baseQuery = knex('Result as r')
    .innerJoin('Assay as a', 'a.id', 'r.assayId')
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .leftOuterJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    // only specified 'currentMonth' and previous month
    .whereRaw(
      `
      ((
        r.endedOn between ? and ?
      )
      OR
      (
       r.endedOn between ? and ?
      ))
    `,
      [
        startOfMonthUTC(currentMonth),
        endOfMonthUTC(currentMonth),
        subMonths(startOfMonthUTC(currentMonth), 1),
        subMonths(endOfMonthUTC(currentMonth), 1),
      ]
    )
    /**
     * exclude testing device type `GxAlert`, allowing any other device types (`CepheidGeneXpert`, `molbioTruenat`, etc).
     * See chunk `if (_.get(constraints, 'deviceType.id')) {` in func `addDevicesAndSitesConstraints`
     * in `api/src/auth/constraints.js` where user permitted deviceType is used
     */
    .whereNot('dt.externalId', 'GxAlert')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
      assay: 'a',
    })
    .modify(filterParams, query, {
      deviceId: 'd.id',
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      deviceName: 'd.name',
      deviceType: 'dt.externalId',
      siteName: 's.name',
    })
    .select(
      'a.name as assayName',
      'a.externalId as assayExternalId',
      // YYYY_MM field for grouping by
      knex.raw(`
        CONCAT_WS(
          '-',
          CAST(YEAR(CONVERT_TZ(r.endedOn,'+00:00','${tz}')) AS CHAR ),
          LPAD(
            CAST(MONTH(CONVERT_TZ(r.endedOn,'+00:00','${tz}')) AS CHAR ),
            2,
            '0'
          )
        ) AS yearMonth
      `)
    )
    .groupBy('a.id', 'yearMonth')

  const basePositiveQuery = baseQuery.clone().whereRaw(`r.resultCategory1 IN (${positiveResultCategories})`)

  /**
   * now clone base queries and add needed joins for only 1 counter
   * Notice that for particular counter all below queries have needed conditions
   * in WHERE clause instead of using CASE blocks with similar conditions in `count()` function
   */
  const dataAll = await baseQuery.clone().count({
    cntAll: knex.raw('DISTINCT r.id'),
  })
  const dataPositive = await basePositiveQuery.clone().count({
    cntAll: knex.raw('DISTINCT r.id'),
  })
  const dataReportedViaEmail = await basePositiveQuery
    .clone()
    .innerJoin('Notification as n', 'r.id', 'n.resultId')
    .innerJoin('EmailMessage as em', 'n.emailMessageId', 'em.id')
    .where('em.messageStatusId', messageStatusToId.Sent)
    .count({
      cntAll: knex.raw('DISTINCT r.id'),
    })
  const dataReportedViaSms = await basePositiveQuery
    .clone()
    .innerJoin('Notification as n', 'r.id', 'n.resultId')
    .innerJoin('SmsMessage as sm', 'n.smsMessageId', 'sm.id')
    .where('sm.messageStatusId', messageStatusToId.Sent)
    .count({
      cntAll: knex.raw('DISTINCT r.id'),
    })
  const dataAllReported = await basePositiveQuery
    .clone()
    .innerJoin('Notification as n', 'r.id', 'n.resultId')
    .leftOuterJoin('EmailMessage as em', 'n.emailMessageId', 'em.id')
    .leftOuterJoin('SmsMessage as sm', 'n.smsMessageId', 'sm.id')
    .whereRaw(
      `(
        em.messageStatusId = ${messageStatusToId.Sent}
        or
        sm.messageStatusId = ${messageStatusToId.Sent}
      )`
    )
    .count({
      cntAll: knex.raw('DISTINCT r.id'),
    })
  const dataWithin2Hours = await basePositiveQuery
    .clone()
    .innerJoin('Notification as n', 'r.id', 'n.resultId')
    .leftOuterJoin('EmailMessage as em', 'n.emailMessageId', 'em.id')
    .leftOuterJoin('SmsMessage as sm', 'n.smsMessageId', 'sm.id')
    .whereRaw(
      `(
        (
          em.messageStatusId = ${messageStatusToId.Sent} 
          and 
          em.createdOn < DATE_ADD(r.endedOn, INTERVAL 2 HOUR)
        )
        or
        (
          sm.messageStatusId = ${messageStatusToId.Sent}
          and
          sm.createdOn < DATE_ADD(r.endedOn, INTERVAL 2 HOUR)
        )
      )`
    )
    .count({
      cntAll: knex.raw('DISTINCT r.id'),
    })

  /**
   * helper func - get actual value for the same assay/month pair or return default 0
   */
  const getCounter = (data, { yearMonth, assayExternalId }) => {
    return data.find(it => it.yearMonth === yearMonth && it.assayExternalId === assayExternalId)?.cntAll || 0
  }
  /**
   * list `dataAll` has all data, so we loop through it and add missing data from
   * other lists which have less data because they had more filtering conditions
   */
  const items = _.map(dataAll, item => {
    item.cntPositive = getCounter(dataPositive, item)
    item.cntReportedViaEmail = getCounter(dataReportedViaEmail, item)
    item.cntReportedViaSms = getCounter(dataReportedViaSms, item)
    item.cntAllReported = getCounter(dataAllReported, item)
    item.cntWithin2Hours = getCounter(dataWithin2Hours, item)
    return item
  })
  return items
}

async function resultsTransmittedDashboard(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const resultCategories = await allResultCategoryToId()
  const positiveResultCategories = _.values(_.pick(resultCategories, getPositiveCategoriesExternalIds()))
  // Because all the datetimes are transformed automatically to UTC
  // and it is not possible to take the offset from that date,
  // it is needed to use this function to obtain the offset received from the querystring.
  const offset = getOffsetFromIsoDateString(query.currentMonth)

  // get all assays which user can access
  const assays = await getAssayQuery(query, dataConstraints, positiveResultCategories)
  const items = await getResultQuery(query, dataConstraints, positiveResultCategories, offset)

  // eslint-disable-next-line no-confusing-arrow
  const roundPercent = percent => (percent < 1 ? Math.round(percent * 10) / 10 : Math.round(percent))

  // helper func for percentages
  const getPercent = (numerator, denominator) => {
    const percent = denominator === 0 ? 0 : (100.0 * numerator) / denominator
    return roundPercent(percent)
  }
  // calculate all percentages
  items.forEach(item => {
    item.percentPositive = getPercent(item.cntPositive, item.cntAll)
    item.percentReported = getPercent(item.cntAllReported, item.cntPositive)
    item.percentViaEmail = getPercent(item.cntReportedViaEmail, item.cntAllReported)
    item.percentViaSms = getPercent(item.cntReportedViaSms, item.cntAllReported)
    item.percentWithin2Hours = getPercent(item.cntWithin2Hours, item.cntAllReported)
  })

  // helpers
  const { currentMonth = new Date() } = query
  const currMonth = formatDateOrDefault(currentMonth, 'yyyy-MM')
  const prevMonth = formatDateOrDefault(subMonths(new Date(currentMonth), 1), 'yyyy-MM')

  const getChange = (pcCurr, pcPrev = null) => {
    if (pcPrev === null) {
      return 0
    }
    return roundPercent(pcCurr - pcPrev)
  }
  const findItem = (yearMonth, assayExternalId) => item =>
    item.yearMonth === yearMonth && item.assayExternalId === assayExternalId

  const data = assays
    .map(({ assayId, assayName, assayExternalId, resultCategoryPositiveId }) => {
      // get items for current and previous month

      const currItem = items.find(findItem(currMonth, assayExternalId))
      const prevItem = items.find(findItem(prevMonth, assayExternalId)) || {}

      const {
        cntAll = 0,
        cntPositive = 0,
        cntAllReported = 0,
        cntReportedViaEmail = 0,
        cntReportedViaSms = 0,
        cntWithin2Hours = 0,
        percentPositive = 0,
        percentReported = 0,
        percentViaEmail = 0,
        percentViaSms = 0,
        percentWithin2Hours = 0,
      } = currItem || {}

      return {
        assayId,
        assayName,
        resultCategoryPositiveId,
        // totals in current month
        cntAll,
        cntPositive,
        cntAllReported,
        cntReportedViaEmail,
        cntReportedViaSms,
        cntWithin2Hours,
        // percent in current month
        percentPositive,
        percentReported,
        percentViaEmail,
        percentViaSms,
        percentWithin2Hours,
        // changes since previous month
        percentPositiveChange: getChange(percentPositive, prevItem.percentPositive),
        percentReportedChange: getChange(percentReported, prevItem.percentReported),
        percentViaEmailChange: getChange(percentViaEmail, prevItem.percentViaEmail),
        percentViaSmsChange: getChange(percentViaSms, prevItem.percentViaSms),
        percentWithin2HoursChange: getChange(percentWithin2Hours, prevItem.percentWithin2Hours),
      }
    })
    .filter(item => item.cntAll > 0)
    .sort((a, b) => b.cntAll - a.cntAll)

  return {
    ok: true,
    currentMonth,
    data,
  }
}

module.exports = resultsTransmittedDashboard
