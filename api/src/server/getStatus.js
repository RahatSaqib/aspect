const AspectCacheSingleton = require('../../aspectCache')
const { knex } = require('../db')

const cache = AspectCacheSingleton.getInstance()

async function getStatus() {
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

  return {
    aspect: { version: cachedVersion },
    lastResult,
    notification: {
      enabledNotificationCount,
      lastSmsSuccess,
      lastSmsError,
      lastEmail,
    },
  }
}

module.exports = { getStatus }
