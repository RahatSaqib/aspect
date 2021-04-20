const Promise = require('bluebird')
const { parseISO, subDays } = require('date-fns')
const _ = require('lodash')
const { startOfTodayUtc, startOfDayUtc } = require('../shared/date')
const logger = require('../shared/logger')

const getCustomToday = today => {
  if (today) {
    if (_.isDate(today)) {
      return startOfDayUtc(today)
    }
    if (_.isString(today)) {
      return parseISO(today)
    }
  }
  return startOfTodayUtc()
}
const getDaysWithNoRuns = async (knex, taskName, daysRange = 30) => {
  const executedDates =
    (await knex('JobExecutionLog')
      .where({ taskName })
      .andWhere(
        'processingDate',
        '>=',
        startOfDayUtc(subDays(new Date(), daysRange))
      )
      .distinct('processingDate')
      .where({ success: true })
      .pluck('processingDate')) || []
  const days = _.map(_.range(daysRange), day =>
    startOfDayUtc(subDays(new Date(), day))
  )
  logger.debug(`Executed dates: ${executedDates}`, {
    reLabel: 'taskTracker:getDaysWithNoRuns',
  })
  const daysToRun = _.differenceWith(
    days,
    executedDates,
    (elem1, elem2) => elem1.toISOString() === elem2.toISOString()
  )
  logger.debug(`Days to run task: ${daysToRun}`, {
    reLabel: 'taskTracker:getDaysWithNoRuns',
  })
  return daysToRun
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

      // If this task is daily basis it will complete the range of dates
      // we want to run the task.
      if (dailyRun)
        daysToRun = await getDaysWithNoRuns(knex, schedulerMethod.name)
      console.log(action, today, daysToRun, getCustomToday(today))
      await Promise.each(daysToRun, async day => {
        console.log('customToday', getCustomToday(day))
        let jobExecutionId
        try {
          ;[jobExecutionId] = await knex('JobExecutionLog').insert({
            taskName: schedulerMethod.name,
            processingDate: getCustomToday(day),
            startDate: new Date(),
          })
          logger.debug(
            `Execute Taks ${schedulerMethod.name} for dates ${getCustomToday(
              day
            )}`,
            { reLabel: 'taskTracker' }
          )
          await schedulerMethod(
            { ...action, today: day.toISOString() },
            { messageContext }
          )
          await knex('JobExecutionLog')
            .update({
              endDate: new Date(),
              success: true,
            })
            .where('id', jobExecutionId)
        } catch (dailyException) {
          await knex('JobExecutionLog')
            .update({
              endDate: new Date(),
              errorMessage: JSON.stringify(dailyException),
            })
            .where('id', jobExecutionId)
        }
      })
    } catch (ex) {
      logger.error(ex, { reLabel: 'taskTracker' })
      await knex('JobExecutionLog').insert({
        taskName: schedulerMethod.name,
        endDate: new Date(),
        errorMessage: JSON.stringify(ex),
      })
    }
  })
}

module.exports = { taskTracker }
