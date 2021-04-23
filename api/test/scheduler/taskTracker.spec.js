const chai = require('chai')
const _ = require('lodash')

const {
  createMessageContext,
  waitForAction,
  waitForIdle,
} = require('../utils/mqUtils')
const { knex } = require('../../src/db')
const { logDeviceMaintenanceStatus } = require('../../src/device/actions')

const { assert } = chai

describe('Scheduler task tracker', () => {
  beforeEach(async () => {
    /**
     * Execute the scheduler task device maintenance status logging for the last 30 days
     */

    const messageContext = await createMessageContext()
    const action = logDeviceMaintenanceStatus()
    await messageContext.dispatch(action)
    await waitForAction(action)
  })
  describe('DEVICE_MAINTENANCE_STATUS_LOG_SCHEDULED', () => {
    it('should log the maintenance status of each un-logged device', async () => {
      const daysExecuted = await knex('SchedulerTaskExecutionLog')
        .orderBy('processingDate', 'DESC')
        .where('success', true)
        .select('startDate', 'processingDate')
        .limit(30)

      const sampleDate1 = daysExecuted[_.random(3, 28, false)]
      const sampleDate2 = daysExecuted[_.random(3, 28, false)]

      /**
        Delete two random days executed from the task scheduler log and from device maintenance status
      */
      await knex('SchedulerTaskExecutionLog')
        .whereIn('processingDate', [
          sampleDate1.processingDate,
          sampleDate2.processingDate,
        ])
        .del()

      await knex('DeviceMaintenanceStatusLog')
        .whereIn(
          'day',
          knex.raw('date(?), date(?)', [
            sampleDate1.processingDate,
            sampleDate2.processingDate,
          ])
        )
        .del()

      /**
       * Validate there is no record for those 2 dates
       */
      const noSchedulerTaskRecords = await knex('SchedulerTaskExecutionLog')
        .where('success', true)
        .whereIn('processingDate', [
          sampleDate1.processingDate,
          sampleDate2.processingDate,
        ])
        .select()
      const noMaintenanceLogRecords = await knex('DeviceMaintenanceStatusLog')
        .whereIn(
          'day',
          knex.raw('date(?), date(?)', [
            sampleDate1.processingDate,
            sampleDate2.processingDate,
          ])
        )
        .select()
      assert.isEmpty(noSchedulerTaskRecords)
      assert.isEmpty(noMaintenanceLogRecords)

      /**
       * Execute the task again for filling the missing dates
       */
      const messageContext = await createMessageContext()
      const action = logDeviceMaintenanceStatus()
      await messageContext.dispatch(action)
      await waitForAction(action)
      await waitForIdle(2000)
      const withSchedulerTaskRecords = await knex('SchedulerTaskExecutionLog')
        .where('success', true)
        .whereIn('processingDate', [
          sampleDate1.processingDate,
          sampleDate2.processingDate,
        ])
        .select()
      const withMaintenanceLogRecords = await knex('DeviceMaintenanceStatusLog')
        .whereIn(
          'day',
          knex.raw('date(?), date(?)', [
            sampleDate1.processingDate,
            sampleDate2.processingDate,
          ])
        )
        .select()
      /**
       * Validates that the task fill the blanks
       */
      assert.isAtLeast(withSchedulerTaskRecords.length, 1)
      assert.isAtLeast(withMaintenanceLogRecords.length, 1)
    })
  })
})
