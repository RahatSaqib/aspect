const NodeCache = require('node-cache')
// stdTTL is the default time-to-live for each cache entry
const stdTTL = 60 * 60 * 6 // 6 hours
const notificationResultCacheKey = 'allResultBasedNotifications'
const notificationIssueCacheKey = 'allIssueBasedNotifications'
class NotificationCache {
  constructor(knex, issueBased, ttl = stdTTL) {
    this.marker = Math.random()
    this.knex = knex
    this.notificationCache = new NodeCache({ stdTTL: ttl })
  }

  async getConditionsToEvaluate(notificationCategory) {
    return this.knex('NotificationTypeCategory as ntc')
      .join('NotificationType as nt', 'nt.notificationTypeCategoryId', 'ntc.id')
      .where('ntc.externalId', notificationCategory)
      .distinct(
        'nt.filterCondition',
        'nt.id as notificationTypeId',
        'ntc.externalId as notificationTypeCategoryId',
        'nt.issueTypeId'
      )
  }

  // flush the cache
  async flushCache() {
    this.notificationCache.flushAll()
  }

  // destroy the cache
  async destroyCache() {
    this.notificationCache.destroy()
    this.notificationCache = null
  }

  // refresh the cache
  async refreshCache() {
    this.notificationCache.flushAll()
    this.notificationCache.del(notificationResultCacheKey)
    this.notificationCache.del(notificationIssueCacheKey)
    this.getCacheValueIssueNotification()
    return this.getCacheValueResultNotification()
  }

  // set the cache key and value
  async setCacheValue(key, value) {
    this.notificationCache.set(key, value)
  }

  // return the cache value
  async getCacheValueResultNotification() {
    return this.getCacheValue(notificationResultCacheKey)
  }

  async getCacheValue(notificationkey) {
    let notificationsType = this.notificationCache.get(notificationkey)

    if (!notificationsType) {
      notificationsType =
        notificationkey === notificationIssueCacheKey
          ? await this.getConditionsToEvaluate('issueBased')
          : await this.getConditionsToEvaluate('resultBased')

      this.setCacheValue(notificationkey, notificationsType)
    }

    return notificationsType
  }

  async getCacheValueIssueNotification() {
    return this.getCacheValue(notificationIssueCacheKey)
  }
}

// singleton pattern for cache  to avoid multiple instances
// singleton pattern class
class NotificationCacheSingleton {
  static getInstance(knex, issueBased = false) {
    if (!NotificationCacheSingleton.instance) {
      NotificationCacheSingleton.instance = new NotificationCache(knex, issueBased)
    }
    return NotificationCacheSingleton.instance
  }
}

module.exports = NotificationCacheSingleton
