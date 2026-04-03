const chai = require('chai')
const addDays = require('date-fns/addDays')
const subDays = require('date-fns/subDays')

const { createTestContext, postToDeviceApi } = require('./utils')
const server = require('../utils/testUtils')
const { knex } = require('../../src/db')
const { startOfDayUtc } = require('../../src/shared/date')
const { deviceMaintenanceTypeToId } = require('../../src/shared/dictionary')

const { assert } = chai

const baseConfig = {
  requirePrinter: 'yes',
  adminPassword: 'pwd123',
  firmwareUpdateRequired: 'no',
}

const context = createTestContext(knex, server, {
  user: 'admin',
  type: 'DaktariVirology',
  partner: 'Partner One',
  baseConfig,
})

describe('Device daily details', () => {
  beforeEach(async () => {
    await context.createDeviceWithApiKey()
  })
  afterEach(context.afterEach)

  describe('when lastCalibrated is included in the configuration data payload', () => {
    const now = new Date()

    // ------------------
    // local helpers
    // ------------------
    const getDeviceMaintenanceStatusLogId = async deviceId => {
      const { deviceMaintenanceStatusLogId } = await knex('Device')
        .where('id', deviceId)
        .first('deviceMaintenanceStatusLogId')
      return deviceMaintenanceStatusLogId
    }
    const getDeviceMaintenance = async whereClause => {
      const deviceMaintenance = await knex('DeviceMaintenance').where(whereClause).first()
      return deviceMaintenance
    }

    it('should process it and may set calibration date for device', async () => {
      const deviceMaintenanceTypeId = await deviceMaintenanceTypeToId('calibration')

      const { deviceAuth, deviceId } = context

      // see that deviceMaintenanceStatusLogId is null
      let dmslId = await getDeviceMaintenanceStatusLogId(deviceId)
      assert.isNull(dmslId)

      /**
       * post lastCalibrated
       */
      const lastCalibrated = startOfDayUtc(subDays(now, 20))
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: {
          includeDeviceConfiguration: true,
          configuration: {
            data: {
              lastCalibrated,
            },
          },
        },
      })

      // deviceMaintenanceStatusLogId is set
      dmslId = await getDeviceMaintenanceStatusLogId(deviceId)
      assert.isDefined(dmslId)

      const where = {
        deviceId,
        deviceMaintenanceTypeId,
        current: 1,
      }

      // DeviceMaintenance.contextDate is set with posted lastCalibrated
      const { contextDate: calibratedOn } = await getDeviceMaintenance(where)
      assert.equal(lastCalibrated.toISOString(), calibratedOn.toISOString())

      /**
       * post lastCalibrated as of 2 days before last calibration
       */
      const lastCalibratedAttempt = subDays(lastCalibrated, 2)
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: {
          includeDeviceConfiguration: true,
          configuration: {
            data: {
              lastCalibrated: lastCalibratedAttempt,
            },
          },
        },
      })

      // deviceMaintenanceStatusLogId is set
      dmslId = await getDeviceMaintenanceStatusLogId(deviceId)
      assert.isDefined(dmslId)

      // DeviceMaintenance.contextDate is NOT set with just posted lastCalibrated
      const { contextDate } = await getDeviceMaintenance(where)
      assert.notEqual(lastCalibratedAttempt.toISOString(), contextDate.toISOString())
      // ... it's value remained unchanged because posted lastCalibrated is before than saved value
      assert.equal(lastCalibrated.toISOString(), calibratedOn.toISOString())

      /**
       * post newer lastCalibrated
       */
      const lastCalibratedNew = addDays(lastCalibrated, 2)
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: {
          includeDeviceConfiguration: true,
          configuration: {
            data: {
              lastCalibrated: lastCalibratedNew,
            },
          },
        },
      })

      // deviceMaintenanceStatusLogId is set
      dmslId = await getDeviceMaintenanceStatusLogId(deviceId)
      assert.isDefined(dmslId)

      // DeviceMaintenance.contextDate is set with just posted lastCalibrated
      const newDeviceMaintenance = await getDeviceMaintenance(where)
      assert.equal(lastCalibratedNew.toISOString(), newDeviceMaintenance.contextDate.toISOString())
    })
  })
})
