const cron = require('node-cron')
const { knex } = require('../../db')

/**
 * Holds the scheduled cron tasks from Report Based Notification to allow creation, modification and deletetion.
 */
class ReportBasedNotificationCache {
  constructor() {
    this.tasks = {}
  }

  addTask = async (notificationTypeId, name, cronExpression, handler) => {
    const timezone = await getNotificationTimeZone(notificationTypeId)

    const taskRef = cron.schedule(cronExpression, () => handler(notificationTypeId), {
      scheduled: true,
      timezone,
    })
    this.tasks[`notificationTyrseId:${notificationTypeId}`] = {
      notificationTypeId,
      cronExpression,
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

    this.tasks[taskId].task.stop()
    delete this.tasks[taskId]
    return true
  }

  createOrUpdateTask = async (notificationTypeId, name, cronExpression, func) => {
    this.removeTask(notificationTypeId)
    await this.addTask(notificationTypeId, name, cronExpression, func)
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

async function getNotificationTimeZone(notificationTypeId) {
  const { timezone } = await knex('NotificationType as nt')
    .join('User as u', 'u.id', knex.raw('ifnull(nt.updatedBy, nt.createdBy)'))
    .join('Person as p', 'p.userId', 'u.id')
    .join('TimeZone as tz', 'tz.id', 'p.timezone')
    .where('nt.id', notificationTypeId)
    .first('tz.timeZone as timezone')
  return timezone
}

module.exports = ReportBasedNotificationCacheSingleton
