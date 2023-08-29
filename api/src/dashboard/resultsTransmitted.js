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

  const resultsQuery = knex('Result as r')
    .innerJoin('Assay as a', 'a.id', 'r.assayId')
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .leftOuterJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('Notification as n', 'r.id', 'n.resultId')
    .leftOuterJoin('EmailMessage as em', function () {
      this.on('n.emailMessageId', 'em.id').andOn('em.messageStatusId', messageStatusToId.Sent)
    })
    .leftOuterJoin('SmsMessage as sm', function () {
      this.on('n.smsMessageId', 'sm.id').andOn('sm.messageStatusId', messageStatusToId.Sent)
    })
    // only specified 'currentMonth' and previous onth
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
    // all results
    .count({
      cntAll: knex.raw('DISTINCT r.id'),
    })
    // all Positive results
    .count({
      cntPositive: knex.raw(`
        DISTINCT
        CASE
          WHEN r.resultCategory1 IN (${positiveResultCategories})
          THEN r.id
          ELSE null
        END
      `),
    })
    // all results with email sent out
    .count({
      cntReportedViaEmail: knex.raw(`
        DISTINCT
        CASE
          WHEN
            r.resultCategory1 IN (${positiveResultCategories})
            AND
            em.id IS NOT NULL
          THEN r.id
          ELSE null
        END
      `),
    })
    // all results with sms sent out
    .count({
      cntReportedViaSms: knex.raw(`
        DISTINCT
        CASE
          WHEN
            r.resultCategory1 IN (${positiveResultCategories})
            AND
            sm.id IS NOT NULL
          THEN r.id
          ELSE null
        END
      `),
    })
    // count results with either email or sms sent out
    .count({
      cntAllReported: knex.raw(`
        DISTINCT
        CASE
          WHEN
            r.resultCategory1 IN (${positiveResultCategories})
            AND (
              em.id IS NOT NULL
              OR
              sm.id IS NOT NULL
            )
          THEN r.id
          ELSE null
        END
      `),
    })
    .count({
      cntWithin2Hours: knex.raw(`
        DISTINCT
        CASE
          WHEN
            r.resultCategory1 IN (${positiveResultCategories})
            AND (
              em.createdOn < DATE_ADD(r.endedOn, INTERVAL 2 HOUR)
              OR
              sm.createdOn < DATE_ADD(r.endedOn, INTERVAL 2 HOUR)
            )
          THEN r.id
          ELSE null
        END
      `),
    })
    .groupBy('a.id', 'yearMonth')
  return resultsQuery
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
