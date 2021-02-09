const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const { subYears, subMonths } = require('date-fns')

const endpointUtils = require('../utils/endpointUtils')

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

  describe('GET data for reports', () => {
    it('should return list of device calibrations with min 1 expired and min 1 soon to expire device', async () => {
      const now = new Date()
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
      // at least 1 device has expired calibration
      assert.isAbove(
        data.filter(it => it.calibratedOn < subYears(now, 1)).length,
        0
      )
      // at least 1 device is going to expire soon
      assert.isAbove(
        data.filter(it => it.calibratedOn < subMonths(now, 8)).length,
        0
      )
    })
  })
})
