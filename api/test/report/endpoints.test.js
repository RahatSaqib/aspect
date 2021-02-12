const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const { subYears, subMonths } = require('date-fns')

const endpointUtils = require('../utils/endpointUtils')

const server = require('../utils/testUtils')
const { createTestContext } = require('../deviceApi/utils')
const { knex } = require('../../src/db')
const { deviceMaintenanceTypeToId } = require('../../src/shared/dictionary')

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
    let context
    let deviceMaintenanceTypeId

    before(async () => {
      context = createTestContext(server, {
        user: 'admin',
        type: 'CepheidGeneXpert',
        partner: 'Partner One',
      })
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
    const getDeviceForReport = async (userName, deviceId) => {
      const {
        getDeviceCalibrationsForReport,
      } = require('../../src/device/service')
      const auth = { credentials: { name: userName } }
      const { ok, total, data } = await getDeviceCalibrationsForReport(auth, {})
      assert.isTrue(ok)
      assert.isAbove(total, 0)
      // check presence of props for row pattern in Excel 'api/templates/device_calibration_report/en.xlsx'
      assert.property(data[0], 'name')
      assert.property(data[0], 'serial')
      assert.property(data[0], 'calibratedOn')
      assert.property(data[0], 'nextCalibrationOn')

      const device = data.find(it => it.id === deviceId)
      assert.isDefined(device)

      return device
    }

    it('should return list of devices with at least one expired device', async () => {
      const { deviceId, user: userName, userId, now } = context
      // insert new entry with expired calibration
      await knex('DeviceMaintenance').insert({
        deviceId,
        deviceMaintenanceTypeId,
        contextDate: subYears(now, 3),
        current: 1,
        createdOn: now,
        createdBy: userId,
        updatedOn: now,
        updatedBy: userId,
      })

      const device = await getDeviceForReport(userName, deviceId)
      // at least our device has expired calibration
      assert.isTrue(device.calibratedOn < subYears(now, 1))
    })

    it('should return list of devices with at least one device which is going to expire soon', async () => {
      const { deviceId, user: userName, userId, now } = context
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

      const device = await getDeviceForReport(userName, deviceId)
      // at least our device is going to expire soon
      assert.isTrue(device.calibratedOn < subMonths(now, 8))
    })
  })
})
