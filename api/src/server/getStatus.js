const AspectCacheSingleton = require('../../aspectCache')
const { knex } = require('../db')

const cache = AspectCacheSingleton.getInstance()

async function getStatus({ query }) {
  const cachedVersion = await cache.getVersion()
  const lastResult = await knex('Result as r').orderBy('id', 'DESC').first(['startedOn', 'endedOn', 'createdOn'])
  const enabledNotificationCount = await knex('NotificationType as nt')
    .where('enabled', true)
    .select({
      smsEnabledNotificationsCount: knex.raw(
        'SUM(CASE WHEN nt.filterCondition ->> "$.sendSms" = true THEN 1 ELSE 0 END)'
      ),
      emailEnabledNotificationsCount: knex.raw(
        'SUM(CASE WHEN nt.filterCondition ->> "$.sendEmail" = true THEN 1 ELSE 0 END)'
      ),
      webEnabledNotificationsCount: knex.raw(
        'SUM(CASE WHEN nt.filterCondition ->> "$.sendWeb" = true THEN 1 ELSE 0 END)'
      ),
    })

  const lastSmsSuccess = await knex('SmsMessage as sm')
    .whereNotNull('phoneNumber')
    .whereNull('errorData')
    .orderBy('id', 'DESC')
    .first(['createdOn'])

  const lastSmsError = await knex('SmsMessage as sm')
    .whereNotNull('phoneNumber')
    .whereNotNull('errorData')
    .orderBy('id', 'DESC')
    .first(['createdOn', 'errorData'])

  const lastEmail = await knex('EmailMessage as sm').orderBy('id', 'DESC').first(['createdOn', 'sendResponse'])

  const { count: unprocessedPayloadsCount } = await knex('DeviceLog')
    .where({ processed: false })
    .count('id as count')
    .first()

  const response = {
    aspect: { version: cachedVersion },
    lastResult,
    unprocessedPayloadsCount,
    notification: {
      enabledNotificationCount,
      lastSmsSuccess,
      lastSmsError,
      lastEmail,
    },
  }

  if (query.addMisinterpretedResultsCount) {
    const { totalUnknownAssays } = await knex('Result as r')
      .join('Device as d', 'd.id', 'r.deviceId')
      .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
      .join('Assay as a', 'a.id', 'r.assayId')
      .andWhere('dt.externalId', 'CepheidGeneXpert')
      .andWhere('a.externalId', 'GxUnknown')
      .count('r.id as totalUnknownAssays')
      .first()

    const { totalSuccessResults } = await knex('Result as r')
      .join('Device as d', 'd.id', 'r.deviceId')
      .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
      .join('ResultCategory as rc', 'rc.id', 'r.resultCategory1')
      .andWhere('dt.externalId', 'CepheidGeneXpert')
      .andWhere('rc.externalId', 'Success')
      .count('r.id as totalSuccessResults')
      .first()

    response.result = {
      totalUnknownAssays,
      totalSuccessResults,
    }
  }

  return response
}

module.exports = { getStatus }
