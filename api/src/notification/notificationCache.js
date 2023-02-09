const NodeCache = require('node-cache')
const { CATEGORY } = require('./constants')
// stdTTL is the default time-to-live for each cache entry
const stdTTL = 60 * 60 * 6 // 6 hours

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
        'nt.issueTypeId',
        'nt.reportId'
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
    this.notificationCache.del(CATEGORY.RESULT_BASED)
    this.notificationCache.del(CATEGORY.ISSUE_BASED)
    this.notificationCache.del(CATEGORY.REPORT_BASED)
    await this.getCacheValueIssueNotification()
    await this.getCacheValueResultNotification()
    await this.getCacheValueReportNotification()
  }

  // set the cache key and value
  async setCacheValue(key, value) {
    this.notificationCache.set(key, value)
  }

  // return the cache value
  async getCacheValueResultNotification() {
    return this.getCacheValue(CATEGORY.RESULT_BASED)
  }

  getExternalId(notificationKey) {
    if (notificationKey === CATEGORY.ISSUE_BASED) {
      return 'issueBased'
    }
    if (notificationKey === CATEGORY.REPORT_BASED) {
      return 'reportBased'
    }
    return 'resultBased'
  }

  async getCacheValue(notificationKey) {
    let notificationsType = this.notificationCache.get(notificationKey)

    if (!notificationsType) {
      const externalId = this.getExternalId(notificationKey)
      notificationsType = await this.getConditionsToEvaluate(externalId)

      this.setCacheValue(notificationKey, notificationsType)
    }

    return notificationsType
  }

  async getCacheValueIssueNotification() {
    return this.getCacheValue(CATEGORY.ISSUE_BASED)
  }

  async getCacheValueReportNotification() {
    return this.getCacheValue(CATEGORY.REPORT_BASED)
  }
}

// singleton pattern for cache to avoid multiple instances
// singleton pattern class
class NotificationCacheSingleton {
  static getInstance(knex) {
    if (!NotificationCacheSingleton.instance) {
      NotificationCacheSingleton.instance = new NotificationCache(knex)
    }
    return NotificationCacheSingleton.instance
  }
}

module.exports = NotificationCacheSingleton
