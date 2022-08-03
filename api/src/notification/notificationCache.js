const NodeCache = require('node-cache')
// stdTTL is the default time-to-live for each cache entry
const stdTTL = 60 * 60 * 6 // 6 hours
class NotificationCache {
  constructor(knex) {
    this.knex = knex
    this.notificationCache = new NodeCache({ stdTTL })
  }

  async getConditionsToEvaluate(notificationCategory = 'resultBased') {
    return this.knex('NotificationTypeCategory as ntc')
      .join('NotificationType as nt', 'nt.notificationTypeCategoryId', 'ntc.id')
      .where('ntc.externalId', notificationCategory)
      .distinct('nt.filterCondition', 'nt.id as notificationTypeId', 'ntc.externalId as notificationTypeCategoryId')
  }

  // flush the cache
  async flushCache() {
    this.notificationCache.flushAll()
  }

  // destroy the cache
  async destroyCache() {
    this.notificationCache.destroy()
    notificationCache = null
  }

  // refresh the cache
  async refreshCache() {
    const conditionsToEvaluate = await this.getConditionsToEvaluate()
    this.setCacheValue(conditionsToEvaluate)
    return conditionsToEvaluate
  }

  // set the cache key and value
  async setCacheValue(value) {
    this.notificationCache.set('allResultBasedNotifications', value)
  }

  // return the cache value
  async getCacheValue() {
    let notificationsType = this.notificationCache.get('allResultBasedNotifications')
    if (!notificationsType) {
      notificationsType = this.refreshCache()
    }
    return notificationsType
  }
}

let notificationCache = null
// singleton pattern for cache  to avoid multiple instances
async function getNotificationCache(knex) {
  if (notificationCache == null) {
    notificationCache = new NotificationCache(knex)
    // refresh the cache
    notificationCache.refreshCache()
  }
  return notificationCache
}

//
module.exports = {
  chache: getNotificationCache,
}
