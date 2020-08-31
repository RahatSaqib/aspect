const _ = require('lodash')
const subMonths = require('date-fns/subMonths')
const formatDate = require('date-fns/format')
const { knex, filterParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const {
  allResultCategoryToId,
  allMessageStatusToId,
} = require('../shared/dictionary')
const getPositiveCategoriesExternalIds = require('../resultCategory/service')

async function getAssayQuery(query, dataConstraints) {
  return knex('Assay as a')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
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
      'a.i18nKey as assayI18nKey'
    )
    .whereIn('a.id', knex('Result').select('assayId').distinct())
    .where('a.externalId', '!=', 'GxUnknown')
    .where('dt.externalId', 'CepheidGeneXpert')
    .orderBy('a.name')
}

async function getResultQuery(query, dataConstraints) {
  const { currentMonth = new Date() } = query
  const resultCategories = await allResultCategoryToId()
  const positiveResultCategories = _.values(_.pick(resultCategories, getPositiveCategoriesExternalIds()))
  const messageStatusToId = await allMessageStatusToId()

  const resultsQuery = knex('Result as r')
    .innerJoin('Assay as a', 'a.id', 'r.assayId')
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .leftOuterJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('ResultCategory as rc1', 'rc1.id', 'r.resultCategory1')
    .leftOuterJoin('ResultCategory as rc2', 'rc2.id', 'r.resultCategory2')
    .leftOuterJoin('Issue AS i', 'r.id', 'i.resultId')
    .leftOuterJoin('IssueType AS it', 'i.issueTypeId', 'it.id')
    .leftOuterJoin('IssueStatus AS ist', 'i.issueStatusId', 'ist.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('EmailMessage as em', function () {
      this.on('r.id', 'em.resultId').andOn(
        'em.messageStatusId',
        messageStatusToId.Sent
      )
    })
    .leftOuterJoin('SmsMessage as sm', function () {
      this.on('r.id', 'sm.resultId').andOn(
        'sm.messageStatusId',
        messageStatusToId.Sent
      )
    })
    // only specified 'currentMonth' and previous onth
    .whereRaw(
      `
        (
          YEAR(r.endedOn) = YEAR(?)
          AND
          MONTH(r.endedOn) = MONTH(?)
        )
        OR
        (
          YEAR(r.endedOn) = YEAR(DATE_SUB(?, INTERVAL 1 MONTH))
          AND
          MONTH(r.endedOn) = MONTH(DATE_SUB(?, INTERVAL 1 MONTH))
        )
      `,
      [currentMonth, currentMonth, currentMonth, currentMonth]
    )
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
      siteName: 's.name',
    })
    .select(
      'a.name as assayName',
      'a.externalId as assayExternalId',
      // YYYY_MM field for grouping by
      knex.raw(`
        CONCAT_WS(
          '-', 
          CAST( YEAR(r.endedOn) AS CHAR ),
          LPAD(
            CAST( MONTH(r.endedOn) AS CHAR ),
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
            AND
            ist.externalId IN ('Active', 'OK', 'Resolved')
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
            AND
            ist.externalId IN ('Active', 'OK', 'Resolved')
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
            AND
            ist.externalId IN ('Active', 'OK', 'Resolved')
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
              em.createdOn BETWEEN r.endedOn AND DATE_ADD(r.endedOn, INTERVAL 2 HOUR)
              OR
              sm.createdOn BETWEEN r.endedOn AND DATE_ADD(r.endedOn, INTERVAL 2 HOUR)
            )
            AND
            ist.externalId IN ('Active', 'OK', 'Resolved')
          THEN r.id
          ELSE null
        END
      `),
    })
    .groupBy('a.id', 'yearMonth')

  return resultsQuery.where('dt.externalId', 'CepheidGeneXpert')
}

async function resultsTransmittedDashboard(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)

  // get all assays which user can access
  const assays = await getAssayQuery(query, dataConstraints)
  const items = await getResultQuery(query, dataConstraints)

  // helper func for percentages
  const getPercent = (numerator, denominator) => {
    return denominator === 0 ? 0 : Math.round((100 * numerator) / denominator)
  }
  // calculate all percentages
  items.forEach(item => {
    item.percentPositive = getPercent(item.cntPositive, item.cntAll)
    item.percentReported = getPercent(item.cntAllReported, item.cntAll)
    item.percentViaEmail = getPercent(
      item.cntReportedViaEmail,
      item.cntAllReported
    )
    item.percentViaSms = getPercent(item.cntReportedViaSms, item.cntAllReported)
    item.percentWithin2Hours = getPercent(
      item.cntWithin2Hours,
      item.cntAllReported
    )
  })

  // helpers
  const { currentMonth = new Date() } = query
  const currMonth = formatDate(currentMonth, 'yyyy-MM')
  const prevMonth = formatDate(subMonths(currentMonth, 1), 'yyyy-MM')
  const getChange = (pcCurr, pcPrev = null) => {
    if (pcPrev === null) {
      return 0
    }
    return pcCurr - pcPrev
  }
  const findItem = (yearMonth, assayExternalId) => item =>
    item.yearMonth === yearMonth && item.assayExternalId === assayExternalId

  const data = assays.map(({ assayName, assayExternalId }) => {
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
      assayName,
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
      percentPositiveChange: getChange(
        percentPositive,
        prevItem.percentPositive
      ),
      percentReportedChange: getChange(
        percentReported,
        prevItem.percentReported
      ),
      percentViaEmailChange: getChange(
        percentViaEmail,
        prevItem.percentViaEmail
      ),
      percentViaSmsChange: getChange(percentViaSms, prevItem.percentViaSms),
      percentWithin2HoursChange: getChange(
        percentWithin2Hours,
        prevItem.percentWithin2Hours
      ),
    }
  })

  console.log(currentMonth)

  return {
    ok: true,
    currentMonth,
    data,
  }
}

module.exports = resultsTransmittedDashboard
