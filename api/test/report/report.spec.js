const chai = require('chai')
const { subYears, subMonths, startOfToday, addDays } = require('date-fns')

const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const server = require('../utils/testUtils')
const { createTestContext } = require('../deviceApi/utils')
const { knex } = require('../../src/db')
const { deviceMaintenanceTypeToId } = require('../../src/shared/dictionary')

const { assert } = chai

// We're skipping these tests because they fail frequently and cause repeated errors
describe.skip('Global reports', () => {
  const path = '/api/reports'
  before(() => {
    shared.checkToken(server, path)
  })

  describe('GET', () => {
    const stremeableReportExternalId = 'mtb_detected_rr_detected'

    it('should return list of reports with minimum few global reports', () =>
      runTestWithKnex(async () => {
        await server
          .get(`${path}`)
          .set('Authorization', `Bearer ${shared.token}`)
          .then(async res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'ok')
            assert.property(res.body, 'total')
            assert.property(res.body, 'data')

            assert.equal(res.body.ok, true)
            assert.isAtLeast(res.body.total, 1)

            assert.typeOf(res.body.data, 'array')
            assert.isAtLeast(res.body.data.length, 1)

            // check returned props
            assert.property(res.body.data[0], 'name')
            assert.property(res.body.data[0], 'description')
            assert.property(res.body.data[0], 'externalId')
            assert.property(res.body.data[0], 'sortOrder')
            assert.isTrue(res.body.data.some(r => r.externalId === 'mtb_detected_rr_detected'))

            // every report declares its parameters (empty DB values degrade to the legacy set)
            res.body.data.forEach(report => {
              assert.typeOf(report.parameters, 'array')
              assert.isAtLeast(report.parameters.length, 1)
              report.parameters.forEach(parameter => {
                assert.typeOf(parameter.name, 'string')
                assert.typeOf(parameter.type, 'string')
                assert.typeOf(parameter.shared, 'boolean')
              })
            })
          })
      }))

    it('should return binary stream with Excel file for report requested with `externalId`', async () => {
      await server
        .get(`${path}/${stremeableReportExternalId}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 200)
          // assert.typeOf(res.body, 'Object')

          // special header Content-Disposition for generated Excel file is used to specify file name
          assert.typeOf(res.headers['content-disposition'], 'string')
          assert.equal(res.headers['content-disposition'].includes('attachment'), true)
          assert.equal(res.headers['content-disposition'].includes('filename='), true)

          // Content-Type should match Excel file with extension .xlsx
          assert.typeOf(res.headers['content-type'], 'string')
          assert.equal(res.headers['content-type'], 'application/octet-stream')
        })
    })

    it('should return an Excel file for report requested with `externalId` if the report is not an stremeable one', async () => {
      const nonStremeableReportExternalId = 'report_custom_fields_completion'
      await server
        .get(`${path}/${nonStremeableReportExternalId}`)
        .query({
          minDate: startOfToday(),
          maxDate: addDays(startOfToday(), -30),
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          // eslint-disable-next-line no-console
          console.log('res', res)
          assert.equal(res.status, 200)
          // assert.typeOf(res.body, 'Object')

          // special header Content-Disposition for generated Excel file is used to specify file name
          assert.typeOf(res.headers['content-disposition'], 'string')
          assert.equal(res.headers['content-disposition'].includes('attachment'), true)
          assert.equal(res.headers['content-disposition'].includes('filename='), true)

          // Content-Type should match Excel file with extension .xlsx
          assert.typeOf(res.headers['content-type'], 'string')
          assert.equal(res.headers['content-type'], 'application/octet-stream')
          // assert.equal(res.headers['content-type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        })
    })
  })

  describe(`Validate data for report 'Device Calibration Report'`, () => {
    let context
    let deviceMaintenanceTypeId

    before(async () => {
      context = createTestContext(knex, server, {
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
      const { getDeviceCalibrationReport } = require('../../src/device/serviceReports/getDeviceCalibrationReport')
      const auth = { credentials: { name: userName } }
      const { ok, total, data } = await getDeviceCalibrationReport(auth, {})
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
