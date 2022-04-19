const { knex, filterDateRangeParams, filterParams } = require('../../db')
const { getBaseQuery, modifiers } = require('../query')

const {
  SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY,
} = require('../query/querySelectors')

async function getSmsStatsData(dataConstraints, params) {
  const { mtbDetected, mtbNotDetected, mtbInvalid, mtbError, mtbNoResult } =
    SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY

  const data = await getBaseQuery(knex, dataConstraints)
    .modify(modifiers.join.resultCategory1)
    .modify(modifiers.join.resultCategory2)
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

  console.log(
    '🚀 ~ file: smsStatsReport.js ~ line 32 ~ getSmsStatsData ~ data.total',
    data
  )
  return {
    facilityTitle: 'Sms Stats Report',
    total: data.total,
    mtbValid,
    errorPlusInvalid,

    smsResultsSentToFacility: 5,
    smsNotificationsSentToClient: 6,
    totalSmsForPeriod: 7,

    averageTATSampleCollectionRegistration: 8,
    averageTATSampleCollection: 9,
    averageTATResultDateResultSent: 10,
    averageTATSampleCollectionResultSent: 11,
  }
}

module.exports = {
  getSmsStatsData,
}
