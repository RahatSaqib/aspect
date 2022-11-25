const Boom = require('@hapi/boom')
const { notificationTypeCreated } = require('../notificationType/actions')
const { getNotificationStatusInfo } = require('./common/db')
const ReportBasedNotificationCacheSingleton = require('./reportBased/reportBasedNotificationCache')
const logger = require('../shared/logger')
const { knex } = require('../db')

/**
 * Does a deeper validation of the filterCondition object.
 * @param {object} filterCondition The filterCondition object
 * @returns true if filterCondition is correct, or a Boom object if a problem was detected
 */

module.exports = async function (request) {
  const {
    params,
    plugins: { messageContext },
  } = request
  const { notificationId: id } = params

  try {
    const { notificationType } = await getNotificationStatusInfo(id)
    await knex('NotificationType').where({ id }).delete()

    if (notificationType === 'reportBased') {
      const cache = ReportBasedNotificationCacheSingleton.getInstance()
      cache.removeTask(id)
    }

    if (!messageContext.notificationTypeCreated) messageContext.bindActionCreators({ notificationTypeCreated })
    messageContext.notificationTypeCreated(id)
  } catch (e) {
    logger.info({ info: `NotificationType ${id} cannot be deleted`, e }, { reLabel: 'aspect:api:notification:delete' })
    throw Boom.badData(`Can not delete this notification type because it already triggered notifications`)
  }

  return { ok: true }
}
