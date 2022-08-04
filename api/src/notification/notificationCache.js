const NodeCache = require('node-cache')
// stdTTL is the default time-to-live for each cache entry
const stdTTL = 60 * 60 * 6 // 6 hours
const notificationCacheKey = 'allResultBasedNotifications'
class NotificationCache {
  constructor(knex, ttl = stdTTL) {
    this.knex = knex
    this.notificationCache = new NodeCache({ stdTTL: ttl, useClones: false })
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
    this.notificationCache = null
  }

  // refresh the cache
  async refreshCache() {
    this.notificationCache.flushAll()
    this.notificationCache.del(notificationCacheKey)
    return this.getCacheValue()
  }

  // set the cache key and value
  async setCacheValue(value) {
    this.notificationCache.set(notificationCacheKey, value)
  }

  // return the cache value
  async getCacheValue() {
    let notificationsType = this.notificationCache.get(notificationCacheKey)

    if (!notificationsType) {
      notificationsType = await this.getConditionsToEvaluate()
    }

    return notificationsType
  }
}

// singleton pattern for cache  to avoid multiple instances
// singleton pattern class
class NotificationCacheSingleton {
  static getInstance(knex) {
    if (!NotificationCacheSingleton.instance) {
      NotificationCacheSingleton.instance = new NotificationCache(knex)
    }
    return NotificationCacheSingleton.instance
  }
}

//
module.exports = NotificationCacheSingleton
