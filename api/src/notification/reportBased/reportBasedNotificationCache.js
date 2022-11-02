const cron = require('node-cron')
/**
 * Holds the scheduled cron tasks from Report Based Notification to allow creation, modification and deletetion.
 */
class ReportBasedNotificationCache {
  constructor() {
    this.tasks = {}
  }

  addTask = (notificationTypeId, name, cronRecurrency, handler) => {
    const taskRef = cron.schedule(cronRecurrency, () => handler(notificationTypeId))
    this.tasks[`notificationTypeId:${notificationTypeId}`] = {
      notificationTypeId,
      cronRecurrency,
      name,
      task: taskRef,
      started: new Date(),
    }
  }

  getTaskIdentifier = id => `notificationTypeId:${id}`

  removeTask = notificationTypeId => {
    const taskId = this.getTaskIdentifier(notificationTypeId)
    if (!this.tasks[taskId]) {
      return false
    }

    this.tasks[taskId].stop()
    delete this.tasks[taskId]
    return true
  }

  updateTask = (notificationTypeId, name, cronExpression, func) => {
    this.removeTask(notificationTypeId)
    this.addTask(notificationTypeId, name, cronExpression, func)
  }
}

class ReportBasedNotificationCacheSingleton {
  static getInstance() {
    if (!ReportBasedNotificationCacheSingleton.instance) {
      ReportBasedNotificationCacheSingleton.instance = new ReportBasedNotificationCache()
    }
    return ReportBasedNotificationCacheSingleton.instance
  }
}

module.exports = ReportBasedNotificationCacheSingleton
