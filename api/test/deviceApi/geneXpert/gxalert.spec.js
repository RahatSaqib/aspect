const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const addYears = require('date-fns/add_years')
const subDays = require('date-fns/sub_days')
const addHours = require('date-fns/add_hours')
const addSeconds = require('date-fns/add_seconds')
const setMilliseconds = require('date-fns/set_milliseconds')
const { createGxAlertTestContext } = require('./gxalert_utils')
const { getLastResultId } = require('../utils')
const {
  resultTextToResultCategoryMapping,
  basicResultPayload,
} = require('./geneXpertConstants')
const { run } = require('../../../src/db')

const server = supertest.agent('http://localhost:8080')
const { assert, expect } = chai

describe('Device API routes for GxAlert Device', () => {
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
        return res
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
      .orderBy('id', 'asc')
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
      _.merge({}, device, {
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
              expect(devicesCreatedDuringTest).to.containSubset([
                {
                  name: context.gxAlertDeviceName,
                  deviceTypeId: gxAlertDeviceType.id,
                },
              ])

              const { deviceAuth, basicDevicePayload } = context
              await postToDeviceApi({
                authHeader: deviceAuth,
                payload: _.merge({}, basicDevicePayload, {
                  name: deviceName,
                }),
              })

              devicesCreatedDuringTest = await getDevicesWithIdLargerThan(
                maxDeviceIdBefore,
                knex
              )

              expect(devicesCreatedDuringTest).to.containSubset([
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
              expect(devicesCreatedDuringTest).to.containSubset([
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

        describe('when a new gxAlertDeviceId is specified', () => {
          const initialGxAlertDeviceId = 2012
          const deviceName = 'Some Laboratory'
          const macAddress = 'MAC00000INITIAL'
          const hostId = 'GXDevice5'
          const instrumentSerialNumbers = ['SERIAL1', 'SERIAL2']

          const context = createContext()
          const {
            beforeCreateGxAlertApiKey,
            useGxAlertDeviceId,
            runTest,
            getCurrentGeneXpertDevice,
            afterCleanUp,
          } = context
          let { deviceAuth, basicDevicePayload } = context

          before(async () =>
            run(async () => {
              await beforeCreateGxAlertApiKey()
              useGxAlertDeviceId(initialGxAlertDeviceId)
              ;({ deviceAuth, basicDevicePayload } = context)
              await postToDeviceApi({
                authHeader: deviceAuth,
                payload: _.merge({}, basicDevicePayload, {
                  name: deviceName,
                  configuration: {
                    data: {
                      macAddress,
                      hostId,
                      instrumentSerialNumbers,
                    },
                  },
                }),
              })
              const initialGeneXpertDevice = await getCurrentGeneXpertDevice()
              expect(initialGeneXpertDevice).to.containSubset({
                name: deviceName,
                shortname: deviceName,
                macAddress,
                serial: instrumentSerialNumbers.join(','),
                hostId,
                configurationData: {
                  macAddress,
                  instrumentSerialNumbers,
                  hostId,
                  gxAlertDeviceId: initialGxAlertDeviceId,
                },
              })
            })
          )
          after(afterCleanUp)

          describe('and other identifying properties already belong to another device', () => {
            it('should create a new GeneXpert device with a duplicate MAC address', () =>
              runTest(async knex => {
                const newGxAlertDeviceId = 8972
                useGxAlertDeviceId(newGxAlertDeviceId)
                ;({ basicDevicePayload } = context)
                await postToDeviceApi({
                  authHeader: deviceAuth,
                  payload: _.merge({}, basicDevicePayload, {
                    name: deviceName,
                    configuration: {
                      data: {
                        macAddress,
                        hostId,
                        instrumentSerialNumbers,
                      },
                    },
                  }),
                })
                const newGeneXpertDevice = await getCurrentGeneXpertDevice()
                expect(newGeneXpertDevice).to.containSubset({
                  name: deviceName,
                  shortname: deviceName,
                  macAddress,
                  serial: instrumentSerialNumbers.join(','),
                  hostId,
                  configurationData: {
                    macAddress,
                    instrumentSerialNumbers,
                    hostId,
                    gxAlertDeviceId: newGxAlertDeviceId,
                  },
                })
                const devicesWithDuplicateProperties = _.map(
                  await knex
                    .from('Device')
                    .where({ macAddress })
                    .orWhere({ hostId })
                    .orWhere('name', deviceName)
                    .orWhere('shortname', deviceName)
                    .orWhere('serial', instrumentSerialNumbers.join(','))
                    .select(),
                  device =>
                    _.assign({}, device, {
                      configurationData: JSON.parse(device.configurationData),
                    })
                )
                expect(devicesWithDuplicateProperties).to.have.length(2)
                expect(devicesWithDuplicateProperties).to.containSubset([
                  {
                    name: deviceName,
                    shortname: deviceName,
                    macAddress,
                    serial: instrumentSerialNumbers.join(','),
                    hostId,
                    configurationData: {
                      macAddress,
                      instrumentSerialNumbers,
                      hostId,
                      gxAlertDeviceId: initialGxAlertDeviceId,
                    },
                  },
                  {
                    name: deviceName,
                    shortname: deviceName,
                    macAddress,
                    serial: instrumentSerialNumbers.join(','),
                    hostId,
                    configurationData: {
                      macAddress,
                      instrumentSerialNumbers,
                      hostId,
                      gxAlertDeviceId: newGxAlertDeviceId,
                    },
                  },
                ])
              }))
          })
        })
      })
    })

    describe('when MAC address changes', () => {
      const deviceName = 'GeneXpert Lab from GxAlert'
      const firstGxAlertDeviceId = 47
      const secondGxAlertDeviceId = 88
      const firstMacAddress = 'MAC0000000FIRST'
      const secondMacAddress = 'MAC000000SECOND'
      const thirdMacAddress = 'MAC0000000THIRD'
      let maxDeviceIdBefore = -1

      const context = createContext()
      const {
        beforeCreateGxAlertApiKey,
        gxAlertDeviceName,
        useGxAlertDeviceId,
        runTest,
        afterCleanUp,
      } = context

      before(async () =>
        run(async knex => {
          maxDeviceIdBefore = await getMaxDeviceId(knex)
          await beforeCreateGxAlertApiKey()
          useGxAlertDeviceId(firstGxAlertDeviceId)
          const { deviceAuth, basicDevicePayload } = context
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge({}, basicDevicePayload, {
              name: deviceName,
              configuration: {
                data: {
                  macAddress: firstMacAddress,
                },
              },
            }),
          })
        })
      )
      after(afterCleanUp)

      describe('and gxAlertDeviceId changes', () => {
        it('should create a new device', () =>
          runTest(async knex => {
            const gxAlertDeviceType = await getDeviceType('GxAlert', knex)
            const geneXpertDeviceType = await getDeviceType(
              'CepheidGeneXpert',
              knex
            )
            const devicesCreatedDuringTestBefore = await getDevicesWithIdLargerThan(
              maxDeviceIdBefore,
              knex
            )
            expect(devicesCreatedDuringTestBefore).to.containSubset([
              {
                name: gxAlertDeviceName,
                deviceTypeId: gxAlertDeviceType.id,
                macAddress: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                macAddress: firstMacAddress,
                configurationData: {
                  macAddress: firstMacAddress,
                  gxAlertDeviceId: firstGxAlertDeviceId,
                },
              },
            ])

            useGxAlertDeviceId(secondGxAlertDeviceId)
            const { deviceAuth, basicDevicePayload } = context
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    macAddress: secondMacAddress,
                  },
                },
              }),
            })

            const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(
              maxDeviceIdBefore,
              knex
            )
            expect(devicesCreatedDuringTestAfter).to.containSubset([
              {
                name: gxAlertDeviceName,
                deviceTypeId: gxAlertDeviceType.id,
                macAddress: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                macAddress: firstMacAddress,
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  macAddress: firstMacAddress,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                macAddress: secondMacAddress,
                configurationData: {
                  gxAlertDeviceId: secondGxAlertDeviceId,
                  macAddress: secondMacAddress,
                },
              },
            ])
          }))
      })

      describe('but gxAlertDeviceId remains the same', () => {
        it('should update the MAC address of the existing device', () =>
          runTest(async knex => {
            const gxAlertDeviceType = await getDeviceType('GxAlert', knex)
            const geneXpertDeviceType = await getDeviceType(
              'CepheidGeneXpert',
              knex
            )
            const devicesCreatedDuringTestBefore = await getDevicesWithIdLargerThan(
              maxDeviceIdBefore,
              knex
            )
            expect(devicesCreatedDuringTestBefore).to.containSubset([
              {
                name: gxAlertDeviceName,
                deviceTypeId: gxAlertDeviceType.id,
                macAddress: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                macAddress: firstMacAddress,
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  macAddress: firstMacAddress,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                macAddress: secondMacAddress,
                configurationData: {
                  macAddress: secondMacAddress,
                },
              },
            ])

            const { deviceAuth, basicDevicePayload } = context
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    macAddress: thirdMacAddress,
                  },
                },
              }),
            })

            const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(
              maxDeviceIdBefore,
              knex
            )

            expect(devicesCreatedDuringTestAfter).to.containSubset([
              {
                name: gxAlertDeviceName,
                deviceTypeId: gxAlertDeviceType.id,
                macAddress: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                macAddress: firstMacAddress,
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  macAddress: firstMacAddress,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                macAddress: thirdMacAddress,
                configurationData: {
                  macAddress: thirdMacAddress,
                },
              },
            ])
          }))
      })

      describe("and collides with another device's MAC address", () => {
        it('should update the MAC address of the device, creating a duplicate MAC address', () =>
          runTest(async knex => {
            const gxAlertDeviceType = await getDeviceType('GxAlert', knex)
            const geneXpertDeviceType = await getDeviceType(
              'CepheidGeneXpert',
              knex
            )
            const devicesCreatedDuringTestBefore = await getDevicesWithIdLargerThan(
              maxDeviceIdBefore,
              knex
            )
            expect(devicesCreatedDuringTestBefore).to.containSubset([
              {
                name: gxAlertDeviceName,
                deviceTypeId: gxAlertDeviceType.id,
                macAddress: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                macAddress: firstMacAddress,
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  macAddress: firstMacAddress,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                macAddress: thirdMacAddress,
                configurationData: {
                  gxAlertDeviceId: secondGxAlertDeviceId,
                  macAddress: thirdMacAddress,
                },
              },
            ])

            const { deviceAuth, basicDevicePayload } = context
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    macAddress: firstMacAddress,
                  },
                },
              }),
            })

            const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(
              maxDeviceIdBefore,
              knex
            )

            expect(devicesCreatedDuringTestAfter).to.containSubset([
              {
                name: gxAlertDeviceName,
                deviceTypeId: gxAlertDeviceType.id,
                macAddress: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                macAddress: firstMacAddress,
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  macAddress: firstMacAddress,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                macAddress: firstMacAddress,
                configurationData: {
                  gxAlertDeviceId: secondGxAlertDeviceId,
                  macAddress: firstMacAddress,
                },
              },
            ])
          }))
      })
    })

    describe('when instrument serial changes', () => {
      const deviceName = 'GeneXpert Lab from GxAlert'
      const firstGxAlertDeviceId = 95
      const secondGxAlertDeviceId = 13
      const firstInstrumentSerial = ['FIRST1', '1FIRST']
      const secondInstrumentSerial = ['SECOND']
      const thirdInstrumentSerial = ['THIRD3', '3THIRD']
      let maxDeviceIdBefore = -1

      const context = createContext()
      const {
        beforeCreateGxAlertApiKey,
        gxAlertDeviceName,
        useGxAlertDeviceId,
        runTest,
        afterCleanUp,
      } = context

      before(async () =>
        run(async knex => {
          maxDeviceIdBefore = await getMaxDeviceId(knex)
          await beforeCreateGxAlertApiKey()
          useGxAlertDeviceId(firstGxAlertDeviceId)
          const { deviceAuth, basicDevicePayload } = context
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge({}, basicDevicePayload, {
              name: deviceName,
              configuration: {
                data: {
                  instrumentSerialNumbers: firstInstrumentSerial,
                },
              },
            }),
          })
        })
      )
      after(afterCleanUp)

      describe('and gxAlertDeviceId changes', () => {
        it('should create a new device', () =>
          runTest(async knex => {
            const gxAlertDeviceType = await getDeviceType('GxAlert', knex)
            const geneXpertDeviceType = await getDeviceType(
              'CepheidGeneXpert',
              knex
            )
            const devicesCreatedDuringTestBefore = await getDevicesWithIdLargerThan(
              maxDeviceIdBefore,
              knex
            )
            expect(devicesCreatedDuringTestBefore).to.containSubset([
              {
                name: gxAlertDeviceName,
                deviceTypeId: gxAlertDeviceType.id,
                serial: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                serial: firstInstrumentSerial.join(','),
                configurationData: {
                  instrumentSerialNumbers: firstInstrumentSerial,
                  gxAlertDeviceId: firstGxAlertDeviceId,
                },
              },
            ])

            useGxAlertDeviceId(secondGxAlertDeviceId)
            const { deviceAuth, basicDevicePayload } = context
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    instrumentSerialNumbers: secondInstrumentSerial,
                  },
                },
              }),
            })

            const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(
              maxDeviceIdBefore,
              knex
            )

            expect(devicesCreatedDuringTestAfter).to.containSubset([
              {
                name: gxAlertDeviceName,
                deviceTypeId: gxAlertDeviceType.id,
                serial: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                serial: firstInstrumentSerial.join(','),
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  instrumentSerialNumbers: firstInstrumentSerial,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                serial: secondInstrumentSerial.join(','),
                configurationData: {
                  gxAlertDeviceId: secondGxAlertDeviceId,
                  instrumentSerialNumbers: secondInstrumentSerial,
                },
              },
            ])
          }))
      })

      describe('but gxAlertDeviceId remains the same', () => {
        it('should update the serial numbers of the existing device', () =>
          runTest(async knex => {
            const gxAlertDeviceType = await getDeviceType('GxAlert', knex)
            const geneXpertDeviceType = await getDeviceType(
              'CepheidGeneXpert',
              knex
            )
            const devicesCreatedDuringTestBefore = await getDevicesWithIdLargerThan(
              maxDeviceIdBefore,
              knex
            )
            expect(devicesCreatedDuringTestBefore).to.containSubset([
              {
                name: gxAlertDeviceName,
                deviceTypeId: gxAlertDeviceType.id,
                serial: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                serial: firstInstrumentSerial.join(','),
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  instrumentSerialNumbers: firstInstrumentSerial,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                serial: secondInstrumentSerial.join(','),
                configurationData: {
                  gxAlertDeviceId: secondGxAlertDeviceId,
                  instrumentSerialNumbers: secondInstrumentSerial,
                },
              },
            ])

            const { deviceAuth, basicDevicePayload } = context
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    instrumentSerialNumbers: thirdInstrumentSerial,
                  },
                },
              }),
            })

            const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(
              maxDeviceIdBefore,
              knex
            )

            expect(devicesCreatedDuringTestAfter).to.containSubset([
              {
                name: gxAlertDeviceName,
                deviceTypeId: gxAlertDeviceType.id,
                macAddress: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                serial: firstInstrumentSerial.join(','),
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  instrumentSerialNumbers: firstInstrumentSerial,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                serial: thirdInstrumentSerial.join(','),
                configurationData: {
                  instrumentSerialNumbers: thirdInstrumentSerial,
                },
              },
            ])
          }))
      })

      describe("and collides with another device's serial number", () => {
        it('should update the serial numbers of the device, creating a duplicate set of serial numbers', () =>
          runTest(async knex => {
            const gxAlertDeviceType = await getDeviceType('GxAlert', knex)
            const geneXpertDeviceType = await getDeviceType(
              'CepheidGeneXpert',
              knex
            )
            const devicesCreatedDuringTestBefore = await getDevicesWithIdLargerThan(
              maxDeviceIdBefore,
              knex
            )
            expect(devicesCreatedDuringTestBefore).to.containSubset([
              {
                name: gxAlertDeviceName,
                deviceTypeId: gxAlertDeviceType.id,
                serial: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                serial: firstInstrumentSerial.join(','),
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  instrumentSerialNumbers: firstInstrumentSerial,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                serial: thirdInstrumentSerial.join(','),
                configurationData: {
                  gxAlertDeviceId: secondGxAlertDeviceId,
                  instrumentSerialNumbers: thirdInstrumentSerial,
                },
              },
            ])

            const { deviceAuth, basicDevicePayload } = context
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    instrumentSerialNumbers: firstInstrumentSerial,
                  },
                },
              }),
            })

            const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(
              maxDeviceIdBefore,
              knex
            )

            expect(devicesCreatedDuringTestAfter).to.containSubset([
              {
                name: gxAlertDeviceName,
                deviceTypeId: gxAlertDeviceType.id,
                serial: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                serial: firstInstrumentSerial.join(','),
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  instrumentSerialNumbers: firstInstrumentSerial,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                serial: firstInstrumentSerial.join(','),
                configurationData: {
                  gxAlertDeviceId: secondGxAlertDeviceId,
                  instrumentSerialNumbers: firstInstrumentSerial,
                },
              },
            ])
          }))
      })
    })
  })

  describe('results', () => {
    const gxAlertDeviceId = 23847
    const deviceName = 'This Lab Has Results!'

    const context = createContext()
    const {
      beforeCreateGxAlertApiKey,
      useGxAlertDeviceId,
      basicDevicePayload,
      runTest,
      getLastResult,
      getCurrentGeneXpertDevice,
      afterCleanUp,
    } = context
    let { deviceAuth, device: gxAlertDevice } = context
    before(async () =>
      run(async () => {
        await beforeCreateGxAlertApiKey()
        useGxAlertDeviceId(gxAlertDeviceId)
        ;({ deviceAuth, device: gxAlertDevice } = context)
      })
    )
    after(afterCleanUp)

    it('should reject a result without a start or end date date', () =>
      runTest(async () => {
        const beforeResultDetails = await getLastResult()

        assert.isUndefined(beforeResultDetails)

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge(
            {},
            basicDevicePayload,
            { name: deviceName },
            basicResultPayload
          ),
          expectedStatusCode: 400,
        })

        const afterResultDetails = await getLastResult()
        assert.isUndefined(afterResultDetails)
      }))

    it('should append a result if the external ID is not known', () =>
      runTest(async () => {
        const { now } = context
        const beforeResultDetails = await getLastResult()

        assert.isUndefined(beforeResultDetails)

        const testStartedOn = setMilliseconds(subDays(now, 3), 0)

        const response = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge(
            {},
            basicDevicePayload,
            { name: deviceName },
            basicResultPayload,
            {
              result: {
                sample: { id: 'new sample' },
                instrument: { serial: 'new instrument' },
                startedOn: testStartedOn,
              },
            }
          ),
          expectedStatusCode: 200,
        })
        assert.typeOf(response.body, 'Object')

        const afterResultDetails = await getLastResult()
        const currentGeneXpertDevice = await getCurrentGeneXpertDevice()
        expect(afterResultDetails).to.containSubset({
          deviceId: currentGeneXpertDevice.id,
          siteId: currentGeneXpertDevice.siteId,
          geographyId: currentGeneXpertDevice.geographyId,
          assay: basicResultPayload.result.assay.id,
          assayVersion: basicResultPayload.result.assay.version,
          resultWorkflowStatus: 'OK',
          resultSource: 'DiagnosticDevice',
          resultType: 'Patient',
          resultCategory1: 'Success',
          resultCategory2: null,
          sampleId: 'new sample',
          sampleCollectedOn: null,
          sampleOriginSiteId: currentGeneXpertDevice.siteId,
          sampleTypeId: null,
          resultData: _.assign({}, basicResultPayload.result.data, {
            geneXpertTestId: basicResultPayload.result.id,
          }),
          startedOn: testStartedOn,
          endedOn: null,
          consumableSerial: null,
          consumableExpirationDate: null,
          consumableLot: null,
          instrumentSerial: 'new instrument',
          moduleName: basicResultPayload.result.instrument.module.name,
          moduleSerial: basicResultPayload.result.instrument.module.serial,
          patientData: basicResultPayload.result.patient,
          senderVersion: basicResultPayload.result.sender.version,
          senderOperator: basicResultPayload.result.sender.operator,
          notes: null,
          errorCode: null,
        })
      }))

    it('should update a result if the external ID is known', () =>
      runTest(async () => {
        const { now } = context
        const beforeResultDetails = await getLastResult()

        assert.isNotEmpty(beforeResultDetails)

        const testStartedOn = setMilliseconds(subDays(now, 3), 0)
        const response = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge(
            {},
            basicDevicePayload,
            { name: deviceName },
            basicResultPayload,
            {
              result: {
                sample: { id: 'new sample' },
                instrument: { serial: 'new instrument' },
                startedOn: testStartedOn,
              },
            }
          ),
          expectedStatusCode: 200,
        })
        assert.typeOf(response.body, 'Object')

        const afterResultDetails = await getLastResult()
        const currentGeneXpertDevice = await getCurrentGeneXpertDevice()
        expect(afterResultDetails).to.containSubset({
          id: beforeResultDetails.id,
          deviceId: currentGeneXpertDevice.id,
          siteId: currentGeneXpertDevice.siteId,
          geographyId: currentGeneXpertDevice.geographyId,
          assay: basicResultPayload.result.assay.id,
          assayVersion: basicResultPayload.result.assay.version,
          resultWorkflowStatus: 'OK',
          resultSource: 'DiagnosticDevice',
          resultType: 'Patient',
          resultCategory1: 'Success',
          resultCategory2: null,
          sampleId: 'new sample',
          sampleCollectedOn: null,
          sampleOriginSiteId: currentGeneXpertDevice.siteId,
          sampleTypeId: null,
          resultData: _.assign({}, basicResultPayload.result.data, {
            geneXpertTestId: basicResultPayload.result.id,
          }),
          startedOn: testStartedOn,
          endedOn: null,
          consumableSerial: null,
          consumableExpirationDate: null,
          consumableLot: null,
          instrumentSerial: 'new instrument',
          moduleName: basicResultPayload.result.instrument.module.name,
          moduleSerial: basicResultPayload.result.instrument.module.serial,
          patientData: basicResultPayload.result.patient,
          senderVersion: basicResultPayload.result.sender.version,
          senderOperator: basicResultPayload.result.sender.operator,
          notes: null,
          errorCode: null,
        })
      }))

    it('should map result categories based on result text', () =>
      runTest(async () => {
        const sendResult = async (
          resultId,
          assay,
          resultText,
          expectedResultCategory1,
          expectedResultCategory2,
          runNumber
        ) => {
          const { now } = context
          const testStartedOn = setMilliseconds(
            addSeconds(subDays(now, 3), runNumber),
            0
          )
          const testEndedOn = setMilliseconds(
            addSeconds(addHours(testStartedOn, 2), runNumber),
            0
          )
          const response = await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge(
              {},
              basicDevicePayload,
              { name: deviceName },
              basicResultPayload,
              {
                result: {
                  id: resultId,
                  startedOn: testStartedOn,
                  endedOn: testEndedOn,
                  assay: { id: assay },
                  data: { resultText },
                },
              }
            ),
            expectedStatusCode: 200,
          })
          assert.typeOf(response.body, 'Object')

          const resultDetails = await getLastResult()

          expect(resultDetails).to.containSubset({
            resultData: {
              geneXpertTestId: resultId,
            },
            resultCategory1: expectedResultCategory1,
            resultCategory2: expectedResultCategory2,
          })
        }

        let runNumber = 1
        for (const resultText in resultTextToResultCategoryMapping) {
          /* eslint-disable no-await-in-loop */
          // Running these requests in parallel causes the connection pool in MySQL to fill up too quickly.
          // This is probably due to the fact table updates.
          // For now: sending these requests sequentially and sweeping this under the rug
          // TODO: Defer fact updates to another process and change this test to send results in parallel
          if (
            resultText &&
            !_.isEmpty(resultTextToResultCategoryMapping[resultText])
          ) {
            const {
              resultId,
              assay,
              resultCategory1,
              resultCategory2,
            } = resultTextToResultCategoryMapping[resultText]
            await sendResult(
              resultId,
              assay,
              resultText,
              resultCategory1,
              resultCategory2,
              runNumber
            )
            runNumber += 1
          }
          /* eslint-enable no-await-in-loop */
        }
      }))

    it('should belong to the GeneXpert device, not the GxAlert device', () =>
      runTest(async knex => {
        const { now } = context
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge(
            {},
            basicDevicePayload,
            { name: deviceName },
            basicResultPayload,
            {
              result: {
                startedOn: setMilliseconds(subDays(now, 3), 0),
              },
            }
          ),
        })
        const result = await getLastResult()
        const geneXpertDevice = await getCurrentGeneXpertDevice()
        const geneXpertDeviceType = await getDeviceType(
          'CepheidGeneXpert',
          knex
        )
        assert.notEqual(gxAlertDevice.id, geneXpertDevice.id)
        assert.equal(geneXpertDevice.deviceTypeId, geneXpertDeviceType.id)
        assert.equal(result.deviceId, geneXpertDevice.id)
      }))

    it('should log the result under the GxAlert device', () =>
      runTest(async knex => {
        const { now } = context
        const resultId = 'ID_FOR_CHECKING_DEVICE_LOGS'
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge(
            {},
            basicDevicePayload,
            { name: deviceName },
            basicResultPayload,
            {
              result: {
                id: resultId,
                startedOn: setMilliseconds(subDays(now, 3), 0),
              },
            }
          ),
        })
        const result = await getLastResult()
        assert.equal(result.resultData.geneXpertTestId, resultId)
        const deviceIdsInDeviceLogsForResult = await knex
          .from('DeviceLog')
          .where('resultId', result.id)
          .pluck('deviceId')
          .distinct()
        assert.deepEqual(deviceIdsInDeviceLogsForResult, [gxAlertDevice.id])
      }))

    describe('when the assay in the result payload is unknown to Aspect', () => {
      const assayName = 'New Assay Type'
      after(async () =>
        run(async knex =>
          knex('Assay')
            .where({ externalId: assayName })
            .delete()
        )
      )

      it('should set the result to assay GxUnknown', () =>
        runTest(async knex => {
          const { now } = context
          const resultId = 'UNIQUE-ID-NEW-ASSAY'
          const assayVersion = '1'
          const getAssayDetails = async assayName =>
            knex('Assay as a')
              .join('AssayType as at', 'a.assayTypeId', 'at.id')
              .join('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
              .where({ 'a.externalId': assayName })
              .first(
                'a.id as assayId',
                'a.name as assayName',
                'a.externalId as assayExternalId',
                'at.name as assayTypeName',
                'dt.externalId as deviceTypeExternalId'
              )
          const newAssayDetailsBefore = await getAssayDetails(assayName)
          assert.isUndefined(newAssayDetailsBefore)

          const testStartedOn = setMilliseconds(subDays(now, 3), 0)

          const response = await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge(
              {},
              basicDevicePayload,
              { name: deviceName },
              basicResultPayload,
              {
                result: {
                  id: resultId,
                  startedOn: testStartedOn,
                  assay: {
                    id: assayName,
                    version: assayVersion,
                  },
                },
              }
            ),
            expectedStatusCode: 200,
          })
          assert.typeOf(response.body, 'Object')

          const resultDetails = await getLastResult()
          expect(resultDetails).to.containSubset({
            resultData: {
              geneXpertTestId: resultId,
            },
            assay: 'GxUnknown',
          })
        }))
    })

    describe('when the assay in the result payload is mapped to a consumable', () => {
      const deductInventoryTestResultId = 'UNIQUE-ID-TEST-DEDUCT-INVENTORY'
      const initialQuantityOnHand = 100
      let expiryDate
      let inventoryItemId

      it('should reduce inventory levels of that consumable appropriately', () =>
        runTest(async knex => {
          const { now } = context
          const consumableAssay = await knex('ConsumableAssay as ca')
            .join('Assay as a', 'ca.assayId', 'a.id')
            .join('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
            .where({ 'dt.externalId': basicDevicePayload.type.id })
            .andWhere('ca.quantity', '>', 0)
            .first('ca.consumableId', 'ca.quantity', 'a.externalId as assayId')

          assert.isNotEmpty(consumableAssay)
          assert.isAbove(consumableAssay.quantity, 0)

          const geneXpertDevice = await getCurrentGeneXpertDevice()
          expiryDate = new Date(addYears(now, 1).setHours(0, 0, 0, 0))
          inventoryItemId = await knex('InventoryItem').insert({
            consumableId: consumableAssay.consumableId,
            siteId: geneXpertDevice.siteId,
            expiresOn: expiryDate,
            quantityOnHand: initialQuantityOnHand,
          })

          const testStartedOn = setMilliseconds(subDays(now, 3), 0)
          const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)

          const response = await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge(
              {},
              basicDevicePayload,
              { name: deviceName },
              basicResultPayload,
              {
                result: {
                  id: deductInventoryTestResultId,
                  startedOn: testStartedOn,
                  endedOn: testEndedOn,
                  sample: { id: 'Existing Sample' },
                  instrument: { serial: 'Existing Instrument' },
                  assay: {
                    id: consumableAssay.assayId,
                    version: '2',
                  },
                },
              }
            ),
            expectedStatusCode: 200,
          })
          assert.typeOf(response.body, 'Object')

          const lastResultId = await getLastResultId(knex, gxAlertDevice.id)
          const inventoryItem = await knex('InventoryItem')
            .where({ id: inventoryItemId })
            .first()
          assert.equal(
            inventoryItem.quantityOnHand,
            initialQuantityOnHand - consumableAssay.quantity
          )

          const inventoryLogs = await knex('InventoryLog as il')
            .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
            .where({ inventoryItemId })
            .select(
              'il.consumableId',
              'il.siteId',
              'cr.name as consumableReason',
              'il.resultId',
              'il.quantity'
            )
          assert.deepEqual(inventoryLogs, [
            {
              consumableId: inventoryItem.consumableId,
              siteId: geneXpertDevice.siteId,
              consumableReason: 'Test Conducted',
              resultId: lastResultId,
              quantity: consumableAssay.quantity,
            },
          ])
        }))

      describe('when the test already exists in the database', () => {
        it('should NOT reduce inventory levels of the consumable', () =>
          runTest(async knex => {
            const { now } = context
            const consumableAssay = await knex('ConsumableAssay as ca')
              .join('Assay as a', 'ca.assayId', 'a.id')
              .join('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
              .where({ 'dt.externalId': basicDevicePayload.type.id })
              .andWhere('ca.quantity', '>', 0)
              .first(
                'ca.consumableId',
                'ca.quantity',
                'a.externalId as assayId'
              )

            assert.isNotEmpty(consumableAssay)
            assert.isAbove(consumableAssay.quantity, 0)

            const inventoryItemBefore = await knex('InventoryItem')
              .where({ id: inventoryItemId })
              .first()

            const testStartedOn = setMilliseconds(subDays(now, 3), 0)
            const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
            const response = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge(
                {},
                basicDevicePayload,
                { name: deviceName },
                basicResultPayload,
                {
                  result: {
                    id: deductInventoryTestResultId,
                    assay: {
                      id: consumableAssay.assayId,
                      version: '2',
                    },
                    sample: { id: 'Existing Sample' },
                    instrument: { serial: 'Existing Instrument' },
                    startedOn: testStartedOn,
                    endedOn: testEndedOn,
                  },
                }
              ),
              expectedStatusCode: 200,
            })
            assert.typeOf(response.body, 'Object')

            const geneXpertDevice = await getCurrentGeneXpertDevice()
            const lastResultId = await getLastResultId(knex, gxAlertDevice.id)
            const inventoryItemAfter = await knex('InventoryItem')
              .where({
                consumableId: consumableAssay.consumableId,
                siteId: geneXpertDevice.siteId,
                expiresOn: expiryDate,
              })
              .first()
            assert.equal(inventoryItemAfter.id, inventoryItemId)
            assert.equal(
              inventoryItemAfter.quantityOnHand,
              inventoryItemBefore.quantityOnHand
            )
            const inventoryLogs = await knex('InventoryLog as il')
              .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
              .where({ inventoryItemId })
              .select(
                'il.consumableId',
                'il.siteId',
                'cr.name as consumableReason',
                'il.resultId',
                'il.quantity'
              )
            assert.deepEqual(inventoryLogs, [
              {
                consumableId: consumableAssay.consumableId,
                siteId: geneXpertDevice.siteId,
                consumableReason: 'Test Conducted',
                resultId: lastResultId,
                quantity: consumableAssay.quantity,
              },
            ])
          }))
      })
    })

    describe('when an error code has been specified in the result payload', () => {
      it('should set the workflow status of the result to error', () =>
        runTest(async () => {
          const { now } = context
          const errorTestResultId = 'UNIQUE-ID-WITH-ERROR-RESULT'
          const errorCode = '12345'

          const testStartedOn = setMilliseconds(subDays(now, 3), 0)
          const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge(
              {},
              basicDevicePayload,
              { name: deviceName },
              basicResultPayload,
              {
                result: {
                  id: errorTestResultId,
                  startedOn: testStartedOn,
                  endedOn: testEndedOn,
                  error: {
                    code: errorCode,
                  },
                },
              }
            ),
          })

          const lastResult = await getLastResult()
          expect(lastResult).to.containSubset({
            errorCode,
            resultCategory1: 'Error',
            resultWorkflowStatus: 'Error',
            resultData: {
              geneXpertTestId: errorTestResultId,
            },
          })
        }))
    })
  })
})
