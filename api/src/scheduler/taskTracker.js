const Promise = require('bluebird')
const { parseISO, subDays } = require('date-fns')
const _ = require('lodash')
const { startOfTodayUtc, startOfDayUtc } = require('../shared/date')
const logger = require('../shared/logger')

const getCustomToday = day => {
  if (day) {
    if (_.isDate(day)) {
      return startOfDayUtc(day)
    }
    if (_.isString(day)) {
      return startOfDayUtc(parseISO(day))
    }
  }
  return startOfTodayUtc()
}
const getDaysWithNoRuns = (executedDates, daysRange = 30) => {
  const days = _.map(_.range(daysRange), day => startOfDayUtc(subDays(new Date(), day)))
  const daysToRun = _.differenceWith(days, executedDates, (elem1, elem2) => elem1.toISOString() === elem2.toISOString())
  logger.debug(`Days to run task: ${daysToRun.length === 0 ? 'No dates to run' : daysToRun}`, {
    reLabel: 'aspect:taskTracker:getDaysWithNoRuns',
  })
  return daysToRun
}

const getDaysWithExecution = async (knex, taskName, daysRange = 30) => {
  const executedDates =
    (await knex('SchedulerTaskExecutionLog')
      .where({ taskName })
      .andWhere('processingDate', '>=', startOfDayUtc(subDays(new Date(), daysRange)))
      .distinct('processingDate')
      .where({ success: true })
      .pluck('processingDate')) || []

  return executedDates
}

/**
 *This is a wrapper function which compose any scheduler task.
 For those task which are daily basis we should pass as part of the action parameter
 today parameter which is going to set which one is the date you want to run and a boolean property which will say if that is daily or not.
 * @param {*} schedulerMethod the name of the function which the scheduler needs to run.
 * @param {*} action the action received from the mq
 * @param {*} messageContext is the context for triggering the messages and which has the correspondent transaction.
 * @returns
 */
const taskTracker = async (schedulerMethod, action, { messageContext }) => {
  return messageContext.run(async knex => {
    try {
      const { dailyRun, today = new Date() } = action

      let daysToRun = [today]

      const executedDates = await getDaysWithExecution(knex, schedulerMethod.name)
      // If this task is daily basis it will complete the range of dates
      // we want to run the task.
      if (dailyRun) daysToRun = getDaysWithNoRuns(executedDates)
      await Promise.each(daysToRun, async day => {
        let jobExecutionId
        try {
          ;[jobExecutionId] = await knex('SchedulerTaskExecutionLog').insert({
            taskName: schedulerMethod.name,
            processingDate: getCustomToday(day),
            startDate: new Date(),
          })

          logger.debug(`Execute Task ${schedulerMethod.name} for dates ${getCustomToday(day)}`, {
            reLabel: 'aspect:taskTracker',
          })
          await schedulerMethod({ ...action, today: day }, { messageContext })
          await knex('SchedulerTaskExecutionLog')
            .update({
              endDate: new Date(),
              success: true,
            })
            .where('id', jobExecutionId)
        } catch (dailyException) {
          const errorMessage = JSON.stringify(dailyException)
          logger.error(dailyException, { reLabel: 'aspect:taskTracker' })
          await knex('SchedulerTaskExecutionLog')
            .update({
              endDate: new Date(),
              errorMessage: _.isEmpty(errorMessage) ? dailyException : errorMessage,
            })
            .where('id', jobExecutionId)
        }
      })
    } catch (ex) {
      const errorMessage = JSON.stringify(ex)
      logger.error(ex, { reLabel: 'aspect:taskTracker' })
      await knex('SchedulerTaskExecutionLog').insert({
        taskName: schedulerMethod.name,
        endDate: new Date(),
        errorMessage: _.isEmpty(errorMessage) ? ex : errorMessage,
      })
    }
  })
}

module.exports = { taskTracker, getDaysWithNoRuns }
