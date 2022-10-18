const chai = require('chai')
const _ = require('lodash')
const { taskTracker } = require('../../src/scheduler/taskTracker')
const { dispatchAndWaitForAction, subscribe } = require('../utils/mqUtils')
const { knex } = require('../../src/db')
const { logDeviceMaintenanceStatus } = require('../../src/device/actions')

const { assert } = chai

describe('Scheduler task tracker', () => {
  describe('DEVICE_MAINTENANCE_STATUS_LOG_SCHEDULED', () => {
    beforeEach(async () => {
      /**
       * Execute the scheduler task device maintenance status logging for the last 30 days
       */
      const action = logDeviceMaintenanceStatus()
      await dispatchAndWaitForAction(action)
    })

    it('should log the maintenance status of each un-logged device for the missing dates', async () => {
      const daysExecuted = await knex('SchedulerTaskExecutionLog')
        .orderBy('processingDate', 'DESC')
        .where('success', true)
        .select('startDate', 'processingDate')
        .limit(30)

      const sampleDate1 = daysExecuted[_.random(2, 10, false)]
      const sampleDate2 = daysExecuted[_.random(11, 16, false)]
      const sampleDate3 = daysExecuted[_.random(17, 28, false)]

      /**
        Delete two random days executed from the task scheduler log and from device maintenance status
      */
      await knex('SchedulerTaskExecutionLog')
        .whereIn('processingDate', [sampleDate1.processingDate, sampleDate2.processingDate])
        .del()
      await knex('SchedulerTaskExecutionLog')
        .where('processingDate', sampleDate3.processingDate)
        .update({ success: false })
      await knex('DeviceMaintenanceStatusLog')
        .whereIn(
          'day',
          knex.raw('date(?), date(?),date(?)', [
            sampleDate1.processingDate,
            sampleDate2.processingDate,
            sampleDate3.processingDate,
          ])
        )
        .del()

      /**
       * Validate there is no record for those 2 dates
       */
      const noSchedulerTaskRecords = await knex('SchedulerTaskExecutionLog')
        .where('success', true)
        .whereIn('processingDate', [sampleDate1.processingDate, sampleDate2.processingDate, sampleDate3.processingDate])
        .select()
      const noMaintenanceLogRecords = await knex('DeviceMaintenanceStatusLog')
        .whereIn(
          'day',
          knex.raw('date(?), date(?), date(?)', [
            sampleDate1.processingDate,
            sampleDate2.processingDate,
            sampleDate3.processingDate,
          ])
        )
        .select()
      assert.isEmpty(noSchedulerTaskRecords)
      assert.isEmpty(noMaintenanceLogRecords)

      /**
       * Execute the task again for filling the missing dates
       */
      const action = logDeviceMaintenanceStatus()
      await dispatchAndWaitForAction(action)

      const withSchedulerTaskRecords = await knex('SchedulerTaskExecutionLog')
        .where('success', true)
        .whereIn('processingDate', [sampleDate1.processingDate, sampleDate2.processingDate, sampleDate3.processingDate])
        .select()
      const withMaintenanceLogRecords = await knex('DeviceMaintenanceStatusLog')
        .whereIn(
          'day',
          knex.raw('date(?), date(?),date(?)', [
            sampleDate1.processingDate,
            sampleDate2.processingDate,
            sampleDate3.processingDate,
          ])
        )
        .select()
      /**
       * Validates that the task fill the blanks
       */
      assert.isAtLeast(withSchedulerTaskRecords.length, 3)
      assert.isAtLeast(withMaintenanceLogRecords.length, 3)
    })
  })
  describe('UNEXISTING_TEST_MESSAGE', () => {
    const myTinyFunc1 = async () => {
      const newLocal = 'The big string Error'
      throw newLocal
    }
    const myTinyFunc2 = async () => {
      throw new Error('The big Error')
    }
    const subscription = {
      actions: {
        UNEXISTING_TEST_MESSAGE: async (action, context) => taskTracker(myTinyFunc2, action, context),
        UNEXISTING_TEST_MESSAGE2: async (action, context) => taskTracker(myTinyFunc1, action, context),
      },
    }
    before(async () => {
      await subscribe('SomeActions', subscription)
    })
    after(async () => {
      await knex('SchedulerTaskExecutionLog').where('success', false).del()
    })
    it('should store exception in SchedulerTaskExecutionLog', async () => {
      const action1 = {
        type: 'UNEXISTING_TEST_MESSAGE',
      }
      const action2 = {
        type: 'UNEXISTING_TEST_MESSAGE2',
      }
      let errorRecords = await knex('SchedulerTaskExecutionLog')
        .whereIn('taskName', ['myTinyFunc1', 'myTinyFunc2'])
        .select()
      assert.lengthOf(errorRecords, 0)

      await dispatchAndWaitForAction(action1)
      await dispatchAndWaitForAction(action2)
      errorRecords = await knex('SchedulerTaskExecutionLog')
        .whereIn('taskName', ['myTinyFunc1', 'myTinyFunc2'])
        .select()
      assert.isAtLeast(errorRecords.length, 2)
      _.each(errorRecords, record => {
        assert.isNotEmpty(record.errorMessage)
        assert.isNotNull(record.errorMessage)
      })
    })
  })
})
