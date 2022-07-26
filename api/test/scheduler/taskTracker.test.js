const { assert } = require('chai')
const _ = require('lodash')
const { addDays } = require('date-fns')
const { getDaysWithNoRuns } = require('../../src/scheduler/taskTracker')
const { startOfDayUtc } = require('../../src/shared/date')

describe('taskTracker helper functions', () => {
  it('should return all dates to be executed the task based on the dates that were executed', () => {
    const daysExecuted = _.map([2, 4, 5], day => startOfDayUtc(addDays(new Date(), -day)))
    const now = new Date()

    const daysToExecute = getDaysWithNoRuns(daysExecuted, 7)

    assert.deepEqual(daysToExecute, [
      startOfDayUtc(now),
      startOfDayUtc(addDays(now, -1)),
      startOfDayUtc(addDays(now, -3)),
      startOfDayUtc(addDays(now, -6)),
    ])
  })
})
