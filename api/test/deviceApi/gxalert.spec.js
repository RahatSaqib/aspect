const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const { createGxAlertTestContext } = require('./gxalert_utils')
const { run } = require('../../src/db')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Device API routes for GxAlert Device', () => {
  describe('registration and configuration', () => {
    describe('when no device API key is specified', () => {
      const context = createGxAlertTestContext(server)

      const { runTest } = context

      it('should respond with UNAUTHORIZED', () =>
        runTest(async () => {
          const { basicDevicePayload } = context
          await server
            .post('/device')
            .set('Authorization', 'Bearer ')
            .send(basicDevicePayload)
            .then(res => {
              assert.equal(res.statusCode, 401)
            })
            .catch(assert.fail)
        }))
    })

    describe('when unknown device API key is specified', () => {
      const context = createGxAlertTestContext(server)

      const { runTest } = context

      it('should respond with UNAUTHORIZED', () =>
        runTest(async () => {
          const { basicDevicePayload } = context
          await server
            .post('/device')
            .set('Authorization', 'Bearer fg2g9cjx0njzgbfmkem0')
            .send(basicDevicePayload)
            .then(res => {
              assert.equal(res.statusCode, 401)
            })
            .catch(assert.fail)
        }))
    })

    describe('when known device API key is specified', () => {
      describe('send new device data', () => {
        describe('before a gxAlertDeviceId has been specified', () => {
          const context = createGxAlertTestContext(server)

          before(context.beforeCreateGxAlertApiKey)
          const { runTest } = context
          after(context.afterCleanUp)

          it('should respond with BAD_REQUEST', () =>
            runTest(async () => {
              const { deviceAuth, basicDevicePayload } = context
              await server
                .post('/device')
                .set('Authorization', deviceAuth)
                .send(basicDevicePayload)
                .then(res => {
                  assert.deepEqual(res.body, {
                    statusCode: 400,
                    error: 'Bad Request',
                    message:
                      'Must specify GxAlert device ID for data from GxAlert',
                  })
                })
                .catch(assert.fail)
            }))
        })

        describe('after a gxAlertDeviceId and deviceName have been specified', () => {
          const deviceName = 'GeneXpert Lab from GxAlert'
          const gxAlertDeviceId = 47
          const context = createGxAlertTestContext(server)
          let maxDeviceIdBefore = 0

          before(async () =>
            run(async knex => {
              ;[maxDeviceIdBefore] = await knex
                .from('Device')
                .orderBy('id', 'desc')
                .limit(1)
                .select('id')
                .pluck('id')
              await context.beforeCreateGxAlertApiKey()
              context.useGxAlertDeviceId(gxAlertDeviceId)
            })
          )
          const { runTest } = context
          after(context.afterCleanUp)

          it('should respond with OK and create a new GeneXpert device', () =>
            runTest(async knex => {
              const gxAlertDeviceType = await knex
                .from('DeviceType')
                .where('externalId', 'GxAlert')
                .first()
              const geneXpertDeviceType = await knex
                .from('DeviceType')
                .where('externalId', 'CepheidGeneXpert')
                .first()
              let devicesCreatedDuringTest = await knex
                .from('Device')
                .where('id', '>', maxDeviceIdBefore)
                .select()

              assert.equal(devicesCreatedDuringTest.length, 1)

              const gxAlertDeviceBefore = devicesCreatedDuringTest[0]
              assert.equal(gxAlertDeviceBefore.name, context.gxAlertDeviceName)
              assert.equal(
                gxAlertDeviceBefore.deviceTypeId,
                gxAlertDeviceType.id
              )

              const { deviceAuth, basicDevicePayload } = context
              await server
                .post('/device')
                .set('Authorization', deviceAuth)
                .send(
                  _.assign({}, basicDevicePayload, {
                    name: deviceName,
                  })
                )
                .then(res => {
                  assert.equal(res.statusCode, 200)
                })
                .catch(assert.fail)

              devicesCreatedDuringTest = await knex
                .from('Device')
                .where('id', '>', maxDeviceIdBefore)
                .orderBy('id', 'desc')
                .select()

              assert.equal(devicesCreatedDuringTest.length, 2)
              const [
                geneXpertDevice,
                gxAlertDeviceAfter,
              ] = devicesCreatedDuringTest

              assert.equal(geneXpertDevice.name, deviceName)
              assert.equal(geneXpertDevice.deviceTypeId, geneXpertDeviceType.id)
              assert.isNull(geneXpertDevice.macAddress)
              assert.equal(
                geneXpertDevice.configurationData,
                `{"gxAlertDeviceId": ${gxAlertDeviceId}}`
              )

              assert.equal(gxAlertDeviceAfter.name, context.gxAlertDeviceName)
              assert.equal(
                gxAlertDeviceAfter.deviceTypeId,
                gxAlertDeviceType.id
              )
              assert.isNull(geneXpertDevice.macAddress)
              assert.equal(gxAlertDeviceAfter.configurationData, '{}')
            }))

          it('should have created a device and NOT link it to the device API key', () =>
            runTest(async knex => {
              const { apiKey } = context

              const deviceDetails = await knex('DeviceApiKey as dak')
                .join('Device as d', 'dak.DeviceId', 'd.id')
                .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
                .where({ 'dak.token': apiKey })
                .select('dt.externalId as deviceTypeExternalId', 'd.name')
              assert.deepEqual(
                _.map(
                  deviceDetails,
                  deviceDetail => deviceDetail.deviceTypeExternalId
                ),
                ['GxAlert']
              )
              assert.notEqual(deviceDetails[0].name, deviceName)
            }))
        })
      })
    })
  })
})
