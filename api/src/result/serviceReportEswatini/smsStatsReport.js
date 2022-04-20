const { formatDuration, intervalToDuration } = require('date-fns')
const { knex, filterDateRangeParams, filterParams } = require('../../db')
const { getBaseQuery, modifiers } = require('../query')
const {
  SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY,
} = require('../query/querySelectors')

async function getResultStatsData(dataConstraints, params) {
  const { mtbDetected, mtbNotDetected, mtbInvalid, mtbError, mtbNoResult } =
    SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY

  const data = await getBaseQuery(knex, dataConstraints)
    .modify(modifiers.join.resultCategory1)
    .modify(filterParams, params)
    .modify(filterDateRangeParams, params, 'r.endedOn')
    .select({
      mtbDetected,
      mtbNotDetected,
      mtbInvalid,
      mtbNoResult,
      mtbError,
      total: knex.raw('IFNULL(COUNT(r.id), 0)'),
    })
    .first()

  const mtbValid = data.mtbDetected + data.mtbNotDetected
  const errorPlusInvalid = data.mtbInvalid + data.mtbError

  return {
    total: data.total,
    mtbValid,
    errorPlusInvalid,
  }
}

async function getSmsStatsData(dataConstraints, params) {
  const data = await getBaseQuery(knex, dataConstraints)
    .join('SmsMessage as sms', 'r.id', 'sms.resultId')
    .join('Sample as s', 'r.sampleId', 's.id')
    .modify(filterParams, params)
    .modify(filterDateRangeParams, params, 'r.endedOn')
    .select({
      totalSmsForPeriod: knex.count('sms.id'),
      smsSentToClient: knex.raw(
        'SUM(CASE sms.personId WHEN NULL THEN 1 ELSE 0 END) '
      ),
      smsSentToFacility: knex.raw(
        'SUM(CASE WHEN sms.siteId = s.originSiteId AND sms.personId IS NOT NULL THEN 1 ELSE 0 END)'
      ),
      averageTATSampleCollectionRegistration: knex.raw(
        "IFNULL(ROUND(AVG(CASE WHEN s.collectedOn IS NOT NULL AND r.startedOn IS NOT NULL THEN TIMESTAMPDIFF(SECOND, s.collectedOn, r.startedOn) ELSE NULL END ),2),'-')"
      ),
      averageTATSampleCollectionResultSent: knex.raw(
        "IFNULL(ROUND(AVG(CASE WHEN s.collectedOn IS NOT NULL AND sms.createdOn IS NOT NULL THEN TIMESTAMPDIFF(SECOND, s.collectedOn, sms.createdOn) ELSE NULL END ) ,2),'-')"
      ),
      averageTATResultDateResultSent: knex.raw(
        "IFNULL(ROUND(AVG(CASE WHEN r.endedOn IS NOT NULL AND sms.createdOn IS NOT NULL THEN TIMESTAMPDIFF(SECOND, r.endedOn, sms.createdOn) ELSE NULL END ) ,2),'-')"
      ),
    })
    .first()

  data.averageTATSampleCollectionRegistration = humanDuration(
    data.averageTATSampleCollectionRegistration
  )
  data.averageTATSampleCollectionResultSent = humanDuration(
    data.averageTATSampleCollectionResultSent
  )
  data.averageTATResultDateResultSent = humanDuration(
    data.averageTATResultDateResultSent
  )
  return data
}

function humanDuration(minutes) {
  const duration = intervalToDuration({ start: 0, end: minutes * 1000 })
  const cleanDuration = {
    days: duration.days,
    hours: duration.hours,
    minutes: duration.minutes,
  }
  return formatDuration(cleanDuration)
}

module.exports = {
  getResultStatsData,
  getSmsStatsData,
}
