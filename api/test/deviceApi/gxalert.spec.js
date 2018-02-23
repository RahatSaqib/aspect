const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const addYears = require('date-fns/add_years')
const subDays = require('date-fns/sub_days')
const addHours = require('date-fns/add_hours')
const subHours = require('date-fns/sub_hours')
const addSeconds = require('date-fns/add_seconds')
const setMilliseconds = require('date-fns/set_milliseconds')
const { createGxAlertTestContext } = require('./gxalert_utils')
const { getLastResult } = require('./genexpert_utils')
const { getLastResultId } = require('./utils')
const { assertSpecifiedItemsEqual } = require('../utils/partialCompare')
const { run } = require('../../src/db')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe.only('Device API routes for GxAlert Device', () => {
  function createContext() {
    return createGxAlertTestContext(server)
  }

  async function postToDeviceApi({
    authHeader,
    payload,
    expectedStatusCode,
    expectedResponseBody,
  }) {
    return server
      .post('/device')
      .set('Authorization', authHeader)
      .send(payload)
      .then(res => {
        if (expectedStatusCode) {
          assert.equal(res.statusCode, expectedStatusCode)
        } else if (
          !expectedResponseBody &&
          !_.inRange(res.statusCode, 200, 300)
        ) {
          assert.fail(
            res.statusCode.toString(),
            '2XX',
            'The post to Aspect device API failed'
          )
        }
        if (expectedResponseBody !== undefined) {
          assert.deepEqual(res.body, expectedResponseBody)
        }
      })
      .catch(error => {
        const { actual, expected, message } = error
        assert.fail(actual, expected, message)
      })
  }

  async function getMaxDeviceId(knex) {
    const [maxDeviceId] = await knex
      .from('Device')
      .orderBy('id', 'desc')
      .limit(1)
      .select('id')
      .pluck('id')
    return maxDeviceId
  }

  const deviceTypes = {}
  async function getDeviceType(externalId, knex) {
    if (!deviceTypes[externalId]) {
      deviceTypes[externalId] = await knex
        .from('DeviceType')
        .where({ externalId })
        .first('id', 'deviceTypeCategoryId', 'externalid', 'name', 'plugin')
    }
    return Promise.resolve(deviceTypes[externalId])
  }

  async function getDevicesWithIdLargerThan(deviceId, knex) {
    const devices = await knex
      .from('Device')
      .where('id', '>', deviceId)
      .select(
        'partnerId',
        'geographyId',
        'siteId',
        'deviceTypeId',
        'deviceStatusId',
        'name',
        'shortName',
        'macAddress',
        'serial',
        'hostId',
        'culture',
        'timezone',
        'configurationData'
      )
    return _.map(devices, device =>
      _.assign({}, device, {
        configurationData: JSON.parse(device.configurationData),
      })
    )
  }

  describe('registration and configuration', () => {
    describe('when no device API key is specified', () => {
      const { runTest, basicDevicePayload } = createContext()
      it('should respond with UNAUTHORIZED', () =>
        runTest(async () =>
          postToDeviceApi({
            authHeader: 'Bearer ',
            payload: basicDevicePayload,
            expectedStatusCode: 401,
          })
        ))
    })

    describe('when unknown device API key is specified', () => {
      const { runTest, basicDevicePayload } = createContext()
      it('should respond with UNAUTHORIZED', () =>
        runTest(async () =>
          postToDeviceApi({
            authHeader: 'Bearer fg2g9cjx0njzgbfmkem0',
            payload: basicDevicePayload,
            expectedStatusCode: 401,
          })
        ))
    })

    describe('when known device API key is specified', () => {
      describe('send new device data', () => {
        describe('before a gxAlertDeviceId has been specified', () => {
          const context = createContext()
          const { beforeCreateGxAlertApiKey, runTest, afterCleanUp } = context
          before(beforeCreateGxAlertApiKey)
          after(afterCleanUp)

          it('should respond with BAD_REQUEST', () =>
            runTest(async () => {
              const { deviceAuth, basicDevicePayload } = context
              await postToDeviceApi({
                authHeader: deviceAuth,
                payload: basicDevicePayload,
                expectedResponseBody: {
                  statusCode: 400,
                  error: 'Bad Request',
                  message:
                    'Must specify GxAlert device ID for data from GxAlert',
                },
              })
            }))
        })

        describe('after a gxAlertDeviceId and deviceName have been specified', () => {
          const deviceName = 'GeneXpert Lab from GxAlert'
          const gxAlertDeviceId = 47
          let maxDeviceIdBefore = -1

          const context = createContext()
          const {
            beforeCreateGxAlertApiKey,
            useGxAlertDeviceId,
            runTest,
            afterCleanUp,
          } = context

          before(async () =>
            run(async knex => {
              maxDeviceIdBefore = await getMaxDeviceId(knex)
              await beforeCreateGxAlertApiKey()
              useGxAlertDeviceId(gxAlertDeviceId)
            })
          )
          after(afterCleanUp)

          it('should respond with OK and create a new GeneXpert device', () =>
            runTest(async knex => {
              const gxAlertDeviceType = await getDeviceType('GxAlert', knex)
              const geneXpertDeviceType = await getDeviceType(
                'CepheidGeneXpert',
                knex
              )
              let devicesCreatedDuringTest = await getDevicesWithIdLargerThan(
                maxDeviceIdBefore,
                knex
              )
              assertSpecifiedItemsEqual(devicesCreatedDuringTest, [
                {
                  name: context.gxAlertDeviceName,
                  deviceTypeId: gxAlertDeviceType.id,
                },
              ])

              const { deviceAuth, basicDevicePayload } = context
              await postToDeviceApi({
                authHeader: deviceAuth,
                payload: _.assign({}, basicDevicePayload, {
                  name: deviceName,
                }),
              })

              devicesCreatedDuringTest = await getDevicesWithIdLargerThan(
                maxDeviceIdBefore,
                knex
              )

              assertSpecifiedItemsEqual(devicesCreatedDuringTest, [
                {
                  name: context.gxAlertDeviceName,
                  deviceTypeId: gxAlertDeviceType.id,
                  macAddress: null,
                  configurationData: {},
                },
                {
                  name: deviceName,
                  deviceTypeId: geneXpertDeviceType.id,
                  macAddress: null,
                  configurationData: { gxAlertDeviceId },
                },
              ])
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
