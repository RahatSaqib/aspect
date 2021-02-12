const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const { subYears, subMonths } = require('date-fns')

const endpointUtils = require('../utils/endpointUtils')

const server = require('../utils/testUtils')
const { createTestContext } = require('../deviceApi/utils')
const { knex } = require('../../src/db')
const { deviceMaintenanceTypeToId } = require('../../src/shared/dictionary')

const baseConfig = {
  requirePrinter: 'yes',
  adminPassword: 'pwd123',
  firmwareUpdateRequired: 'no',
}
const context = createTestContext(server, {
  user: 'admin',
  type: 'DaktariVirology',
  partner: 'Partner One',
  baseConfig,
})

describe('report endpoints', () => {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/report/endpoints', {
      './service': serviceStub,
    })
    return _.find(endpoints.routes, { method, path })
  }

  describe('GET', () => {
    describe('/reports', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/reports', {
          async getReports() {
            return expectedResponse
          },
        })
      })
      it('Should respond with the data returned from the service', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .handleResponseWith(response => {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })
  })

  describe('GET data for report Device Calibration Past Due', () => {
    let deviceMaintenanceTypeId
    before(async () => {
      deviceMaintenanceTypeId = await deviceMaintenanceTypeToId('calibration')
    })
    beforeEach(async () => {
      await context.createDeviceWithResult()

      const { deviceId } = context
      // just in case - reset device's current state for calibration
      await knex('DeviceMaintenance').update({ current: 0 }).where({
        deviceId,
        deviceMaintenanceTypeId,
      })
    })
    afterEach(async () => context.afterEach)

    // helper func which runs func and return same list of devices as for report
    const getDataForReport = async () => {
      const {
        getDeviceCalibrationsForReport,
      } = require('../../src/device/service')
      const auth = { credentials: { name: 'admin' } }
      const { ok, total, data } = await getDeviceCalibrationsForReport(auth, {})
      assert.isTrue(ok)
      assert.isAbove(total, 0)
      // check presence of props for row pattern in Excel 'api/templates/device_calibration_report/en.xlsx'
      assert.property(data[0], 'name')
      assert.property(data[0], 'serial')
      assert.property(data[0], 'calibratedOn')
      assert.property(data[0], 'nextCalibrationOn')

      return data
    }

    it('should return list of devices with at least one expired device', async () => {
      const { deviceId, userId, now } = context
      // insert new entry with expired calibration
      await knex('DeviceMaintenance').insert({
        deviceId,
        deviceMaintenanceTypeId,
        contextDate: subYears(now, 1.5),
        current: 1,
        createdOn: now,
        createdBy: userId,
        updatedOn: now,
        updatedBy: userId,
      })

      const data = await getDataForReport()
      // at least 1 device has expired calibration
      assert.isAbove(
        data.filter(it => it.calibratedOn < subYears(now, 1)).length,
        0
      )
    })

    it('should return list of devices with at least one device which is going to expire soon', async () => {
      const { deviceId, userId, now } = context
      // insert new entry with expired calibration
      await knex('DeviceMaintenance').insert({
        deviceId,
        deviceMaintenanceTypeId,
        contextDate: subMonths(now, 9),
        current: 1,
        createdOn: now,
        createdBy: userId,
        updatedOn: now,
        updatedBy: userId,
      })

      const data = await getDataForReport()
      // at least 1 device is going to expire soon
      assert.isAbove(
        data.filter(it => it.calibratedOn < subMonths(now, 8)).length,
        0
      )
    })
  })
})
