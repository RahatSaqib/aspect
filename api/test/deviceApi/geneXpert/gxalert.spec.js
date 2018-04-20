const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const addYears = require('date-fns/add_years')
const subDays = require('date-fns/sub_days')
const addDays = require('date-fns/add_days')
const addHours = require('date-fns/add_hours')
const subHours = require('date-fns/sub_hours')
const subMinutes = require('date-fns/sub_minutes')
const addSeconds = require('date-fns/add_seconds')
const setMilliseconds = require('date-fns/set_milliseconds')
const dateFormat = require('date-fns/format')
const Promise = require('bluebird')
const { createGxAlertTestContext } = require('./gxalert_utils')
const {
  postToDeviceApi,
  getMaxDeviceId,
  getDeviceType,
  getDevicesWithIdLargerThan,
} = require('./utils')
const {
  resultTextToResultCategoryMapping,
  basicResultPayload,
} = require('./geneXpertConstants')
const { run } = require('../../../src/db')
const { waitForApproximately } = require('../../utils/generatorFunctionUtils')

const server = supertest.agent('http://localhost:8080')
const { assert, expect } = chai

describe('Device API routes for GxAlert Device', () => {
  function createContext() {
    return createGxAlertTestContext(server)
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
              const response = await postToDeviceApi({
                authHeader: deviceAuth,
                payload: _.merge({}, basicDevicePayload, {
                  name: deviceName,
                }),
              })
              expect(
                Object.assign({}, response.body.device, {
                  configurationData: JSON.parse(
                    response.body.device.configurationData
                  ),
                })
              ).to.containSubset({
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                macAddress: null,
                configurationData: { gxAlertDeviceId },
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
          const deviceSerialNumber = 'SERIAL1'
          const instrumentSerialNumbers = ['SERIAL2', 'SERIAL3']

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
              const response = await postToDeviceApi({
                authHeader: deviceAuth,
                payload: _.merge({}, basicDevicePayload, {
                  name: deviceName,
                  configuration: {
                    data: {
                      macAddress,
                      hostId,
                      deviceSerialNumber,
                      instrumentSerialNumbers,
                    },
                  },
                }),
              })
              expect(
                Object.assign({}, response.body.device, {
                  configurationData: JSON.parse(
                    response.body.device.configurationData
                  ),
                })
              ).to.containSubset({
                name: deviceName,
                shortName: deviceName,
                macAddress,
                serial: deviceSerialNumber,
                hostId,
                configurationData: {
                  macAddress,
                  deviceSerialNumber,
                  instrumentSerialNumbers,
                  hostId,
                  gxAlertDeviceId: initialGxAlertDeviceId,
                },
              })
              const initialGeneXpertDevice = await getCurrentGeneXpertDevice()
              expect(initialGeneXpertDevice).to.containSubset({
                name: deviceName,
                shortName: deviceName,
                macAddress,
                serial: deviceSerialNumber,
                hostId,
                configurationData: {
                  macAddress,
                  deviceSerialNumber,
                  instrumentSerialNumbers,
                  hostId,
                  gxAlertDeviceId: initialGxAlertDeviceId,
                },
              })
            })
          )
          after(afterCleanUp)

          describe('and other identifying properties already belong to another device', () => {
            it('should update the gxAlertDeviceId on the existing device', () =>
              runTest(async knex => {
                const newGxAlertDeviceId = 8972
                useGxAlertDeviceId(newGxAlertDeviceId)
                ;({ basicDevicePayload } = context)
                const response = await postToDeviceApi({
                  authHeader: deviceAuth,
                  payload: _.merge({}, basicDevicePayload, {
                    name: deviceName,
                    configuration: {
                      data: {
                        macAddress,
                        hostId,
                        deviceSerialNumber,
                        instrumentSerialNumbers,
                      },
                    },
                  }),
                })
                expect(
                  Object.assign({}, response.body.device, {
                    configurationData: JSON.parse(
                      response.body.device.configurationData
                    ),
                  })
                ).to.containSubset({
                  name: deviceName,
                  shortName: deviceName,
                  macAddress,
                  serial: deviceSerialNumber,
                  hostId,
                  configurationData: {
                    macAddress,
                    deviceSerialNumber,
                    instrumentSerialNumbers,
                    hostId,
                    gxAlertDeviceId: newGxAlertDeviceId,
                  },
                })
                const newGeneXpertDevice = await getCurrentGeneXpertDevice()
                expect(newGeneXpertDevice).to.containSubset({
                  name: deviceName,
                  shortName: deviceName,
                  macAddress,
                  serial: deviceSerialNumber,
                  hostId,
                  configurationData: {
                    macAddress,
                    deviceSerialNumber,
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
                    .orWhere('shortName', deviceName)
                    .orWhere('serial', deviceSerialNumber)
                    .select(),
                  device =>
                    _.assign({}, device, {
                      configurationData: JSON.parse(device.configurationData),
                    })
                )
                expect(devicesWithDuplicateProperties).to.have.length(1)
                expect(devicesWithDuplicateProperties).to.containSubset([
                  {
                    name: deviceName,
                    shortName: deviceName,
                    macAddress,
                    serial: deviceSerialNumber,
                    hostId,
                    configurationData: {
                      macAddress,
                      deviceSerialNumber,
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
        getCurrentGeneXpertDevice,
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
            const response = await postToDeviceApi({
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
            expect(
              Object.assign({}, response.body.device, {
                configurationData: JSON.parse(
                  response.body.device.configurationData
                ),
              })
            ).to.containSubset({
              name: deviceName,
              deviceTypeId: geneXpertDeviceType.id,
              macAddress: secondMacAddress,
              configurationData: {
                gxAlertDeviceId: secondGxAlertDeviceId,
                macAddress: secondMacAddress,
              },
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
            const response = await postToDeviceApi({
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
            expect(
              Object.assign({}, response.body.device, {
                configurationData: JSON.parse(
                  response.body.device.configurationData
                ),
              })
            ).to.containSubset({
              name: deviceName,
              deviceTypeId: geneXpertDeviceType.id,
              macAddress: thirdMacAddress,
              configurationData: {
                macAddress: thirdMacAddress,
              },
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
            const response = await postToDeviceApi({
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
            expect(
              Object.assign({}, response.body.device, {
                configurationData: JSON.parse(
                  response.body.device.configurationData
                ),
              })
            ).to.containSubset({
              name: deviceName,
              deviceTypeId: geneXpertDeviceType.id,
              macAddress: firstMacAddress,
              configurationData: {
                gxAlertDeviceId: secondGxAlertDeviceId,
                macAddress: firstMacAddress,
              },
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

      describe('to NULL', () => {
        it('should not update the macAddress to NULL', () =>
          runTest(async () => {
            const { deviceAuth, basicDevicePayload } = context
            const geneXpertDeviceId = 7334
            useGxAlertDeviceId(geneXpertDeviceId)
            const validMacAddress = 'MAC0000000VALID'
            const response = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    macAddress: validMacAddress,
                  },
                },
              }),
            })
            expect(
              Object.assign({}, response.body.device, {
                configurationData: JSON.parse(
                  response.body.device.configurationData
                ),
              })
            ).to.containSubset({
              macAddress: validMacAddress,
              configurationData: {
                gxAlertDeviceId: geneXpertDeviceId,
                macAddress: validMacAddress,
              },
            })

            const deviceWithMacBefore = await getCurrentGeneXpertDevice()
            expect(deviceWithMacBefore).to.containSubset({
              macAddress: validMacAddress,
              configurationData: {
                gxAlertDeviceId: geneXpertDeviceId,
                macAddress: validMacAddress,
              },
            })

            const nextResponse = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    macAddress: null,
                  },
                },
              }),
            })
            expect(
              Object.assign({}, nextResponse.body.device, {
                configurationData: JSON.parse(
                  nextResponse.body.device.configurationData
                ),
              })
            ).to.containSubset({
              macAddress: validMacAddress,
              configurationData: {
                gxAlertDeviceId: geneXpertDeviceId,
                macAddress: validMacAddress,
              },
            })

            const deviceWithMacAfter = await getCurrentGeneXpertDevice()
            assert.equal(deviceWithMacAfter.id, deviceWithMacBefore.id)
            expect(deviceWithMacAfter).to.containSubset({
              macAddress: validMacAddress,
              configurationData: {
                gxAlertDeviceId: geneXpertDeviceId,
                macAddress: validMacAddress,
              },
            })
          }))
      })
    })

    describe('when instrument serial changes', () => {
      const deviceName = 'GeneXpert Lab from GxAlert'
      const firstGxAlertDeviceId = 95
      const secondGxAlertDeviceId = 13
      const firstDeviceSerial = 'FIRST1'
      const secondDeviceSerial = 'SECOND'
      const thirdDeviceSerial = 'THIRD3'
      let maxDeviceIdBefore = -1

      const context = createContext()
      const {
        beforeCreateGxAlertApiKey,
        gxAlertDeviceName,
        useGxAlertDeviceId,
        runTest,
        getCurrentGeneXpertDevice,
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
                  deviceSerialNumber: firstDeviceSerial,
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
                serial: firstDeviceSerial,
                configurationData: {
                  deviceSerialNumber: firstDeviceSerial,
                  gxAlertDeviceId: firstGxAlertDeviceId,
                },
              },
            ])

            useGxAlertDeviceId(secondGxAlertDeviceId)
            const { deviceAuth, basicDevicePayload } = context
            const response = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    deviceSerialNumber: secondDeviceSerial,
                  },
                },
              }),
            })
            expect(
              Object.assign({}, response.body.device, {
                configurationData: JSON.parse(
                  response.body.device.configurationData
                ),
              })
            ).to.containSubset({
              name: deviceName,
              deviceTypeId: geneXpertDeviceType.id,
              serial: secondDeviceSerial,
              configurationData: {
                gxAlertDeviceId: secondGxAlertDeviceId,
                deviceSerialNumber: secondDeviceSerial,
              },
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
                serial: firstDeviceSerial,
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  deviceSerialNumber: firstDeviceSerial,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                serial: secondDeviceSerial,
                configurationData: {
                  gxAlertDeviceId: secondGxAlertDeviceId,
                  deviceSerialNumber: secondDeviceSerial,
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
                serial: firstDeviceSerial,
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  deviceSerialNumber: firstDeviceSerial,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                serial: secondDeviceSerial,
                configurationData: {
                  gxAlertDeviceId: secondGxAlertDeviceId,
                  deviceSerialNumber: secondDeviceSerial,
                },
              },
            ])

            const { deviceAuth, basicDevicePayload } = context
            const response = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    deviceSerialNumber: thirdDeviceSerial,
                  },
                },
              }),
            })
            expect(
              Object.assign({}, response.body.device, {
                configurationData: JSON.parse(
                  response.body.device.configurationData
                ),
              })
            ).to.containSubset({
              name: deviceName,
              deviceTypeId: geneXpertDeviceType.id,
              serial: thirdDeviceSerial,
              configurationData: {
                deviceSerialNumber: thirdDeviceSerial,
              },
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
                serial: firstDeviceSerial,
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  deviceSerialNumber: firstDeviceSerial,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                serial: thirdDeviceSerial,
                configurationData: {
                  deviceSerialNumber: thirdDeviceSerial,
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
                serial: firstDeviceSerial,
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  deviceSerialNumber: firstDeviceSerial,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                serial: thirdDeviceSerial,
                configurationData: {
                  gxAlertDeviceId: secondGxAlertDeviceId,
                  deviceSerialNumber: thirdDeviceSerial,
                },
              },
            ])

            const { deviceAuth, basicDevicePayload } = context
            const response = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    deviceSerialNumber: firstDeviceSerial,
                  },
                },
              }),
            })
            expect(
              Object.assign({}, response.body.device, {
                configurationData: JSON.parse(
                  response.body.device.configurationData
                ),
              })
            ).to.containSubset({
              name: deviceName,
              deviceTypeId: geneXpertDeviceType.id,
              serial: firstDeviceSerial,
              configurationData: {
                gxAlertDeviceId: secondGxAlertDeviceId,
                deviceSerialNumber: firstDeviceSerial,
              },
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
                serial: firstDeviceSerial,
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  deviceSerialNumber: firstDeviceSerial,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                serial: firstDeviceSerial,
                configurationData: {
                  gxAlertDeviceId: secondGxAlertDeviceId,
                  deviceSerialNumber: firstDeviceSerial,
                },
              },
            ])
          }))
      })

      describe('to NULL', () => {
        it('should not update the serial to NULL', () =>
          runTest(async () => {
            const { deviceAuth, basicDevicePayload } = context
            const geneXpertDeviceId = 7335
            useGxAlertDeviceId(geneXpertDeviceId)
            const deviceSerialNumber = 'SERIAL1'
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: { deviceSerialNumber },
                },
              }),
            })

            const deviceWithSerialBefore = await getCurrentGeneXpertDevice()
            expect(deviceWithSerialBefore).to.containSubset({
              serial: deviceSerialNumber,
              configurationData: {
                gxAlertDeviceId: geneXpertDeviceId,
                deviceSerialNumber,
              },
            })

            const response = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    deviceSerialNumber: null,
                  },
                },
              }),
            })
            expect(
              Object.assign({}, response.body.device, {
                configurationData: JSON.parse(
                  response.body.device.configurationData
                ),
              })
            ).to.containSubset({
              serial: deviceSerialNumber,
              configurationData: {
                gxAlertDeviceId: geneXpertDeviceId,
                deviceSerialNumber,
              },
            })

            const deviceWithSerialAfter = await getCurrentGeneXpertDevice()
            assert.equal(deviceWithSerialAfter.id, deviceWithSerialBefore.id)
            expect(deviceWithSerialAfter).to.containSubset({
              serial: deviceSerialNumber,
              configurationData: {
                gxAlertDeviceId: geneXpertDeviceId,
                deviceSerialNumber,
              },
            })
          }))
      })
    })

    describe('when hostId changes', () => {
      const deviceName = 'GeneXpert Lab from GxAlert'
      const firstGxAlertDeviceId = 47
      const secondGxAlertDeviceId = 88
      const firstHostId = 'HostId1'
      const secondHostId = 'HostId Two'
      const thirdHostId = 'Third Host ID'
      let maxDeviceIdBefore = -1

      const context = createContext()
      const {
        beforeCreateGxAlertApiKey,
        gxAlertDeviceName,
        useGxAlertDeviceId,
        runTest,
        getCurrentGeneXpertDevice,
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
                  hostId: firstHostId,
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
                hostId: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                hostId: firstHostId,
                configurationData: {
                  hostId: firstHostId,
                  gxAlertDeviceId: firstGxAlertDeviceId,
                },
              },
            ])

            useGxAlertDeviceId(secondGxAlertDeviceId)
            const { deviceAuth, basicDevicePayload } = context
            const response = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    hostId: secondHostId,
                  },
                },
              }),
            })
            expect(
              Object.assign({}, response.body.device, {
                configurationData: JSON.parse(
                  response.body.device.configurationData
                ),
              })
            ).to.containSubset({
              name: deviceName,
              deviceTypeId: geneXpertDeviceType.id,
              hostId: secondHostId,
              configurationData: {
                gxAlertDeviceId: secondGxAlertDeviceId,
                hostId: secondHostId,
              },
            })

            const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(
              maxDeviceIdBefore,
              knex
            )
            expect(devicesCreatedDuringTestAfter).to.containSubset([
              {
                name: gxAlertDeviceName,
                deviceTypeId: gxAlertDeviceType.id,
                hostId: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                hostId: firstHostId,
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  hostId: firstHostId,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                hostId: secondHostId,
                configurationData: {
                  gxAlertDeviceId: secondGxAlertDeviceId,
                  hostId: secondHostId,
                },
              },
            ])
          }))
      })

      describe('but gxAlertDeviceId remains the same', () => {
        it('should update the Host ID of the existing device', () =>
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
                hostId: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                hostId: firstHostId,
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  hostId: firstHostId,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                hostId: secondHostId,
                configurationData: {
                  hostId: secondHostId,
                },
              },
            ])

            const { deviceAuth, basicDevicePayload } = context
            const response = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    hostId: thirdHostId,
                  },
                },
              }),
            })
            expect(
              Object.assign({}, response.body.device, {
                configurationData: JSON.parse(
                  response.body.device.configurationData
                ),
              })
            ).to.containSubset({
              name: deviceName,
              deviceTypeId: geneXpertDeviceType.id,
              hostId: thirdHostId,
              configurationData: {
                hostId: thirdHostId,
              },
            })

            const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(
              maxDeviceIdBefore,
              knex
            )

            expect(devicesCreatedDuringTestAfter).to.containSubset([
              {
                name: gxAlertDeviceName,
                deviceTypeId: gxAlertDeviceType.id,
                hostId: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                hostId: firstHostId,
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  hostId: firstHostId,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                hostId: thirdHostId,
                configurationData: {
                  hostId: thirdHostId,
                },
              },
            ])
          }))
      })

      describe("and collides with another device's Host ID", () => {
        it('should update the Host ID of the device, creating a duplicate Host ID', () =>
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
                hostId: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                hostId: firstHostId,
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  hostId: firstHostId,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                hostId: thirdHostId,
                configurationData: {
                  gxAlertDeviceId: secondGxAlertDeviceId,
                  hostId: thirdHostId,
                },
              },
            ])

            const { deviceAuth, basicDevicePayload } = context
            const response = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    hostId: firstHostId,
                  },
                },
              }),
            })
            expect(
              Object.assign({}, response.body.device, {
                configurationData: JSON.parse(
                  response.body.device.configurationData
                ),
              })
            ).to.containSubset({
              name: deviceName,
              deviceTypeId: geneXpertDeviceType.id,
              hostId: firstHostId,
              configurationData: {
                gxAlertDeviceId: secondGxAlertDeviceId,
                hostId: firstHostId,
              },
            })

            const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(
              maxDeviceIdBefore,
              knex
            )

            expect(devicesCreatedDuringTestAfter).to.containSubset([
              {
                name: gxAlertDeviceName,
                deviceTypeId: gxAlertDeviceType.id,
                hostId: null,
                configurationData: {},
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                hostId: firstHostId,
                configurationData: {
                  gxAlertDeviceId: firstGxAlertDeviceId,
                  hostId: firstHostId,
                },
              },
              {
                name: deviceName,
                deviceTypeId: geneXpertDeviceType.id,
                hostId: firstHostId,
                configurationData: {
                  gxAlertDeviceId: secondGxAlertDeviceId,
                  hostId: firstHostId,
                },
              },
            ])
          }))
      })

      describe('to NULL', () => {
        it('should not update the Host ID to NULL', () =>
          runTest(async () => {
            const { deviceAuth, basicDevicePayload } = context
            const geneXpertDeviceId = 7336
            useGxAlertDeviceId(geneXpertDeviceId)
            const validHostId = 'Xpert Host'
            const response = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    hostId: validHostId,
                  },
                },
              }),
            })
            expect(
              Object.assign({}, response.body.device, {
                configurationData: JSON.parse(
                  response.body.device.configurationData
                ),
              })
            ).to.containSubset({
              hostId: validHostId,
              configurationData: {
                gxAlertDeviceId: geneXpertDeviceId,
                hostId: validHostId,
              },
            })

            const deviceWithHostIdBefore = await getCurrentGeneXpertDevice()
            expect(deviceWithHostIdBefore).to.containSubset({
              hostId: validHostId,
              configurationData: {
                gxAlertDeviceId: geneXpertDeviceId,
                hostId: validHostId,
              },
            })

            const nextResponse = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    hostId: null,
                  },
                },
              }),
            })
            expect(
              Object.assign({}, nextResponse.body.device, {
                configurationData: JSON.parse(
                  nextResponse.body.device.configurationData
                ),
              })
            ).to.containSubset({
              hostId: validHostId,
              configurationData: {
                gxAlertDeviceId: geneXpertDeviceId,
                hostId: validHostId,
              },
            })

            const deviceWithHostIdAfter = await getCurrentGeneXpertDevice()
            assert.equal(deviceWithHostIdAfter.id, deviceWithHostIdBefore.id)
            expect(deviceWithHostIdAfter).to.containSubset({
              hostId: validHostId,
              configurationData: {
                gxAlertDeviceId: geneXpertDeviceId,
                hostId: validHostId,
              },
            })
          }))
      })
    })

    describe('when configuration data is sparser than a previous request', () => {
      const gxAlertDeviceId = 445
      const context = createContext()
      const {
        beforeCreateGxAlertApiKey,
        useGxAlertDeviceId,
        runTest,
        getCurrentGeneXpertDevice,
        afterCleanUp,
      } = context

      before(async () =>
        run(async () => {
          await beforeCreateGxAlertApiKey()
          useGxAlertDeviceId(gxAlertDeviceId)
          const { deviceAuth } = context
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload: {
              name: 'Xpert Lab',
              serial: 'DESKTOP-028CNRT',
              status: null,
              type: { id: 'CepheidGeneXpert' },
              site: null,
              checkpoint: null,
              log: null,
              configuration: {
                checkpoint: null,
                data: {
                  macAddress: 'MAC0A0027000010',
                  hostId: 'xPertLab',
                  culture: 'en-ZA',
                  computerOsVersion: 'Microsoft Windows NT 6.2.9200.0',
                  timezone: 'Eastern Standard Time',
                  country: 'US',
                  routerNumber: '562340956',
                  sim1SerialNumber: '203981234097',
                  sim2SerialNumber: '23472903587',
                  labContactCell: '+27800243232',
                  labContactEmail: 'test@example.com',
                  labContactName: 'Mrs Lab COntact',
                  installerCell: '+27831238183',
                  installerEmail: 'another@someemail.io',
                  installerName: 'Mr Installer',
                  latestGrabbedModifiedDate: '2015-12-15T00:33:38',
                  uploadProbeLevelData: true,
                  gxConnectVersion: '1.10.0.0',
                  databaseDeviceOk: true,
                  lisConfigOk: true,
                  nsisInstaller: true,
                  putInService: '2018-01-01T08:02:30',
                  putInServiceSource: 1,
                  lastCalibrated: '2018-01-01T08:02:30',
                  teamViewerId: '',
                  teamViewerPassword: '',
                  noInventory: false,
                  latestErrors: null,
                  autoCompleteJsonDate: '',
                  enableCustomFields: true,
                  deviceSerialNumber: 'SERIAL2',
                  dbVersion: '3.0.5.0',
                  lisConfig:
                    'True|xPertLab|0|0|1|True|192.168.8.113|3012|-1|1|ASSAY=MTB-RIF 2[MTB=MTB][Rif Resistance=Rif Resistance][QC Check=QC Check]',
                  gxAlertDeviceId,
                },
              },
              operation: null,
              result: null,
            },
          })
        })
      )
      after(afterCleanUp)

      it('should keep data from the prior request', () =>
        runTest(async () => {
          const geneXpertDeviceAfterDailyDetails = await getCurrentGeneXpertDevice()
          const { deviceAuth } = context
          const response = await postToDeviceApi({
            authHeader: deviceAuth,
            payload: {
              name: 'Xpert Lab',
              serial: 'DESKTOP-028CNRT',
              status: null,
              type: { id: 'CepheidGeneXpert' },
              site: null,
              checkpoint: null,
              log: null,
              configuration: {
                checkpoint: null,
                data: {
                  macAddress: 'MAC0A0027000010',
                  gxAlertDeviceId,
                },
              },
              operation: null,
              result: null,
            },
          })
          const geneXpertDeviceAfterPing = await getCurrentGeneXpertDevice()

          assert.deepEqual(
            JSON.parse(response.body.device.configurationData),
            geneXpertDeviceAfterPing.configurationData
          )

          assert.deepEqual(
            geneXpertDeviceAfterPing.configurationData,
            geneXpertDeviceAfterDailyDetails.configurationData
          )
        }))
    })

    describe('when maintenance data is included in device configuration data', () => {
      const context = createContext()
      const deviceName = 'Xpert Lab With Maintenance'
      const deviceSerial = 'Cepheid-1874GX'
      const hostId = 'MaintenanceXpertLab'
      const country = 'MM'
      const partner = 'Myanmar'
      const gxAlertDeviceId = 153

      const {
        beforeCreateGxAlertApiKey,
        useGxAlertDeviceId,
        runTest,
        afterCleanUp,
      } = context

      let deviceId
      let standardDevicePayload

      async function getLatestDeviceMaintenanceStatusLog(knex) {
        const logEntry = await knex('DeviceMaintenanceStatusLog as dmsl')
          .innerJoin(
            'DeviceMaintenanceStatus as dms',
            'dmsl.deviceMaintenanceStatusId',
            'dms.id'
          )
          .where('dmsl.deviceId', deviceId)
          .orderByRaw('dmsl.changedOn DESC, dmsl.id DESC')
          .first(
            'dms.token',
            'dmsl.data',
            'dmsl.id',
            'dmsl.changedOn',
            'dmsl.createdOn'
          )
        if (_.isEmpty(logEntry)) {
          return logEntry
        }
        return _.merge(logEntry, { data: JSON.parse(logEntry.data) })
      }

      before(async () =>
        run(async () => {
          await beforeCreateGxAlertApiKey({
            countryAbbreviation: country,
            partnerName: partner,
          })
          useGxAlertDeviceId(gxAlertDeviceId)
          const { deviceAuth } = context
          standardDevicePayload = {
            authHeader: deviceAuth,
            payload: {
              name: deviceName,
              serial: deviceSerial,
              status: null,
              type: { id: 'CepheidGeneXpert' },
              site: null,
              checkpoint: null,
              log: null,
              configuration: {
                checkpoint: null,
                data: {
                  macAddress: 'MAC0A0127001010',
                  hostId,
                  culture: 'en-US',
                  computerOsVersion: 'Microsoft Windows NT 6.2.9200.0',
                  timezone: 'Myanmar Standard Time',
                  country,
                  routerNumber: '029347800',
                  sim1SerialNumber: '82347234879',
                  sim2SerialNumber: '90878796559',
                  labContactCell: '+27800243232',
                  labContactEmail: 'test@contract.co',
                  labContactName: 'Mr Lab Contact',
                  installerCell: '+27831238183',
                  installerEmail: 'another@email.io',
                  installerName: 'Mr Installer',
                  latestGrabbedModifiedDate: '2018-03-15T14:12:34',
                  uploadProbeLevelData: true,
                  gxConnectVersion: '1.10.1.0',
                  databaseDeviceOk: true,
                  lisConfigOk: true,
                  nsisInstaller: true,
                  putInService: '2018-01-01T08:02:30',
                  putInServiceSource: 1,
                  lastCalibrated: '2018-01-01T08:02:30',
                  teamViewerId: '',
                  teamViewerPassword: '',
                  noInventory: false,
                  latestErrors: null,
                  autoCompleteJsonDate: '',
                  enableCustomFields: true,
                  deviceSerialNumber: deviceSerial,
                  dbVersion: '3.0.5.0',
                  lisConfig:
                    'True|xPertLab|0|0|1|True|192.168.8.113|3012|-1|1|ASSAY=MTB-RIF 2[MTB=MTB][Rif Resistance=Rif Resistance][QC Check=QC Check]',
                  gxAlertDeviceId,
                },
              },
              operation: null,
              result: null,
            },
          }
          const response = await postToDeviceApi(standardDevicePayload)
          deviceId = response.body.device.id
        })
      )
      after(afterCleanUp)

      describe('which has been updated since the device configuration was last updated', () => {
        it('should create an entry in the device maintenance status log', () =>
          runTest(async knex => {
            const { now } = context

            const deviceMaintenanceLogBeforeMaintenanceUpdate = await getLatestDeviceMaintenanceStatusLog(
              knex
            )
            assert.isUndefined(deviceMaintenanceLogBeforeMaintenanceUpdate)

            await postToDeviceApi(
              _.merge(standardDevicePayload, {
                payload: {
                  configuration: {
                    data: {
                      inactive: false,
                    },
                  },
                },
              })
            )

            const deviceMaintenanceLogAfterFirstMaintenanceUpdate = await getLatestDeviceMaintenanceStatusLog(
              knex
            )
            expect(
              deviceMaintenanceLogAfterFirstMaintenanceUpdate
            ).to.containSubset({
              token: 'online',
              data: {
                reason: null,
                note: null,
                expectedBackOnline: null,
              },
            })

            const inactiveMaintenanceReason =
              'Connectivity issues, router cannot connect'
            const inactiveMaintenanceNote = 'Router only has one SIM in it'
            const inactiveMaintenanceExpectedBackOnline = dateFormat(
              addDays(now, 15),
              'YYYY-MM-DD'
            )
            await postToDeviceApi(
              _.merge(standardDevicePayload, {
                payload: {
                  configuration: {
                    data: {
                      inactive: true,
                      inactiveMaintenanceReason,
                      inactiveMaintenanceNote,
                      inactiveMaintenanceExpectedBackOnline,
                    },
                  },
                },
              })
            )

            const deviceMaintenanceLogAfterSecondMaintenanceUpdate = await getLatestDeviceMaintenanceStatusLog(
              knex
            )
            expect(
              deviceMaintenanceLogAfterSecondMaintenanceUpdate
            ).to.containSubset({
              token: 'offline',
              data: {
                reason: inactiveMaintenanceReason,
                note: inactiveMaintenanceNote,
                expectedBackOnline: inactiveMaintenanceExpectedBackOnline,
              },
            })
          }))

        describe('which includes {... inactive: false... }', () => {
          it('should clear the values in maintenance status log data', () =>
            runTest(async knex => {
              const { now } = context

              const inactiveMaintenanceReason = 'Connectivity Problems'
              const inactiveMaintenanceNote = 'Router cannot connect to VPN'
              const inactiveMaintenanceExpectedBackOnline = dateFormat(
                addDays(now, 23),
                'YYYY-MM-DD'
              )
              await postToDeviceApi(
                _.merge(standardDevicePayload, {
                  payload: {
                    configuration: {
                      data: {
                        inactive: true,
                        inactiveMaintenanceReason,
                        inactiveMaintenanceNote,
                        inactiveMaintenanceExpectedBackOnline,
                      },
                    },
                  },
                })
              )

              const deviceMaintenanceLogAfterInactiveMaintenanceUpdate = await getLatestDeviceMaintenanceStatusLog(
                knex
              )
              expect(
                deviceMaintenanceLogAfterInactiveMaintenanceUpdate
              ).to.containSubset({
                token: 'offline',
                data: {
                  reason: inactiveMaintenanceReason,
                  note: inactiveMaintenanceNote,
                  expectedBackOnline: inactiveMaintenanceExpectedBackOnline,
                },
              })

              await waitForApproximately(100, 'milliseconds')

              const activeMaintenanceReason = 'Connectivity Resolved'
              const activeMaintenanceNote = 'VPN config was incorrect'
              const activeMaintenanceExpectedBackOnline = dateFormat(
                now,
                'YYYY-MM-DD'
              )
              await postToDeviceApi(
                _.merge(standardDevicePayload, {
                  payload: {
                    configuration: {
                      data: {
                        inactive: false,
                        inactiveMaintenanceReason: activeMaintenanceReason,
                        inactiveMaintenanceNote: activeMaintenanceNote,
                        inactiveMaintenanceExpectedBackOnline: activeMaintenanceExpectedBackOnline,
                      },
                    },
                  },
                })
              )

              const deviceMaintenanceLogAfterActiveMaintenanceUpdate = await getLatestDeviceMaintenanceStatusLog(
                knex
              )
              expect(
                deviceMaintenanceLogAfterActiveMaintenanceUpdate
              ).to.containSubset({
                token: 'online',
                data: {
                  reason: null,
                  note: null,
                  expectedBackOnline: null,
                },
              })
            }))
        })
      })

      describe('which is just a duplicate of what was sent previously', () => {
        it('should NOT create an entry in the device maintenance status log', () =>
          runTest(async knex => {
            const { now } = context

            const inactiveMaintenanceReason = 'Duplicate No ping'
            const inactiveMaintenanceNote = 'Duplicate Router shows connected'
            const inactiveMaintenanceExpectedBackOnline = dateFormat(
              addDays(now, 19),
              'YYYY-MM-DD'
            )
            await waitForApproximately(100, 'milliseconds')
            await postToDeviceApi(
              _.merge(standardDevicePayload, {
                payload: {
                  configuration: {
                    data: {
                      inactive: true,
                      inactiveMaintenanceReason,
                      inactiveMaintenanceNote,
                      inactiveMaintenanceExpectedBackOnline,
                    },
                  },
                },
              })
            )

            const deviceMaintenanceLogAfterInactiveUpdate = await getLatestDeviceMaintenanceStatusLog(
              knex
            )
            expect(deviceMaintenanceLogAfterInactiveUpdate).to.containSubset({
              token: 'offline',
              data: {
                reason: inactiveMaintenanceReason,
                note: inactiveMaintenanceNote,
                expectedBackOnline: inactiveMaintenanceExpectedBackOnline,
              },
            })

            await waitForApproximately(100, 'milliseconds')
            await postToDeviceApi(
              _.merge(standardDevicePayload, {
                payload: {
                  configuration: {
                    data: {
                      inactive: true,
                      inactiveMaintenanceReason,
                      inactiveMaintenanceNote,
                      inactiveMaintenanceExpectedBackOnline,
                    },
                  },
                },
              })
            )

            const deviceMaintenanceLogAfterSecondInactiveUpdate = await getLatestDeviceMaintenanceStatusLog(
              knex
            )
            assert.deepEqual(
              deviceMaintenanceLogAfterSecondInactiveUpdate,
              deviceMaintenanceLogAfterInactiveUpdate
            )
          }))
      })
    })
  })

  describe('ping', () => {
    const deviceName = 'GeneXpert Lab Pinged GxAlert'
    const gxAlertDeviceId = 8322
    const macAddress = 'MAC00000000PING'

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
        useGxAlertDeviceId(gxAlertDeviceId)
        ;({ deviceAuth, basicDevicePayload } = context)
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            configuration: {
              data: { macAddress },
            },
          }),
        })
      })
    )
    after(afterCleanUp)

    it('should update the last seen and last ping time', () =>
      runTest(async () => {
        const deviceBefore = await getCurrentGeneXpertDevice()
        await waitForApproximately(1, 'second')
        const response = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: {
            name: deviceName,
            serial: null,
            status: null,
            type: { id: 'CepheidGeneXpert' },
            site: null,
            checkpoint: null,
            log: null,
            configuration: {
              checkpoint: null,
              data: { macAddress, gxAlertDeviceId },
            },
            operation: null,
            result: null,
          },
        })
        response.body.device.id.should.equal(deviceBefore.id)
        new Date(response.body.device.lastSeenOn).should.be.above(
          deviceBefore.lastSeenOn
        )
        new Date(response.body.device.lastPingOn).should.be.above(
          deviceBefore.lastPingOn
        )

        const deviceAfter = await getCurrentGeneXpertDevice()
        deviceAfter.id.should.equal(deviceBefore.id)
        deviceAfter.lastSeenOn.should.be.above(deviceBefore.lastSeenOn)
        deviceAfter.lastPingOn.should.be.above(deviceBefore.lastPingOn)
      }))
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

    it('should append a result if the instrument, sample, test date combination is not known', () =>
      runTest(async () => {
        const { now } = context
        const beforeResultDetails = await getLastResult()

        assert.isUndefined(beforeResultDetails)

        const testStartedOn = setMilliseconds(
          subMinutes(
            subHours(now, Math.floor(Math.random() * 24)),
            Math.floor(Math.random() * 60)
          ),
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

    it('should update a result if the sample ID, instrument serial and test start times are known', () =>
      runTest(async () => {
        const { now } = context
        const testStartedOn = setMilliseconds(
          subMinutes(
            subHours(now, Math.floor(Math.random() * 24)),
            Math.floor(Math.random() * 60)
          ),
          0
        )
        const sampleId = 'This test will be updated'
        const instrumentSerial = 'Tested on the same instrument'

        // Send a new result
        const firstResponse = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge(
            {},
            basicDevicePayload,
            { name: deviceName },
            basicResultPayload,
            {
              result: {
                sample: { id: sampleId },
                instrument: { serial: instrumentSerial },
                startedOn: testStartedOn,
              },
            }
          ),
          expectedStatusCode: 200,
        })

        await waitForApproximately(2, 'seconds')

        // Send new data about existing result
        const newResultData = {
          customFieldData: {
            '1': {
              notAvailable: false,
              label: 'HIV Status',
              value: 'Positive',
            },
            '2': {
              notAvailable: false,
              label: 'Visual Analysis',
              value: 'Blood Stained',
            },
          },
        }
        const secondResponse = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge(
            {},
            basicDevicePayload,
            { name: deviceName },
            basicResultPayload,
            {
              result: {
                sample: { id: sampleId },
                instrument: { serial: instrumentSerial },
                startedOn: testStartedOn,
                data: newResultData,
              },
            }
          ),
          expectedStatusCode: 200,
        })

        const { body: { result: firstResult } } = firstResponse
        const { body: { result: secondResult } } = secondResponse
        assert.equal(secondResult.id, firstResult.id)
        assert.equal(secondResult.createdOn, firstResult.createdOn)
        expect(JSON.parse(secondResult.resultData)).to.containSubset(
          newResultData
        )
        expect(new Date(secondResult.updatedOn)).to.be.above(
          new Date(firstResult.updatedOn)
        )
      }))

    it('should merge results with same sample ID, start time, end time and instrument serial', () =>
      runTest(async knex => {
        const { deviceAuth, now } = context

        const resultIds = []
        const countResults = () =>
          knex('Result')
            .count('id as cnt')
            .then(([{ cnt }]) => cnt)
        const initialCount = await countResults()

        let deviceApiResponse = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge(
            {},
            basicDevicePayload,
            { name: deviceName },
            basicResultPayload,
            {
              result: {
                startedOn: now,
                endedOn: now,
                instrument: {
                  serial: 'CEPH-PC-7813',
                },
                sample: {
                  id: "Bryan's Sputum",
                },
                data: { a: 'b' },
                assay: { id: 'GxHiv1Vl' },
              },
            }
          ),
          expectedStatusCode: 200,
        })
        resultIds.push(deviceApiResponse.body.result.id)

        let result1 = await knex('Result as r')
          .where({ id: resultIds[0] })
          .first()
        expect(JSON.parse(result1.resultData)).to.containSubset({ a: 'b' })
        assert.isNotOk(result1.errorCode)
        assert.equal(initialCount + 1, await countResults())

        deviceApiResponse = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge(
            {},
            basicDevicePayload,
            { name: deviceName },
            basicResultPayload,
            {
              result: {
                startedOn: now,
                endedOn: now,
                instrument: {
                  serial: 'CEPH-PC-7813',
                },
                sample: {
                  id: "Bryan's Sputum",
                },
                data: { a: 'b', c: 'd' },
                assay: { id: 'GxHiv1Vl' },
              },
            }
          ),
          expectedStatusCode: 200,
        })
        assert.equal(deviceApiResponse.body.result.id, resultIds.slice(-1)[0])

        result1 = await knex('Result as r')
          .where({ id: resultIds.slice(-1)[0] })
          .first()
        expect(JSON.parse(result1.resultData)).to.containSubset({
          a: 'b',
          c: 'd',
        })
        assert.isNotOk(result1.errorCode)
        assert.equal(initialCount + 1, await countResults())

        deviceApiResponse = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge(
            {},
            basicDevicePayload,
            { name: deviceName },
            basicResultPayload,
            {
              result: {
                startedOn: subMinutes(now, 5),
                endedOn: now,
                instrument: {
                  serial: 'CEPH-PC-7813',
                },
                sample: {
                  id: "Bryan's Sputum",
                },
                data: { a: 'b' },
                assay: { id: 'GxHiv1Vl' },
              },
            }
          ),
          expectedStatusCode: 200,
        })
        let lastResultId = deviceApiResponse.body.result.id
        assert.notEqual(lastResultId, resultIds[0])

        resultIds.push(lastResultId)

        let result2 = await knex('Result as r')
          .where({ id: resultIds[1] })
          .first()
        assert.equal(initialCount + 2, await countResults())

        const result1SampleSite = await knex('Site as s')
          .where({ id: result1.siteId })
          .first()

        const result2SampleSite = await knex('Site as s')
          .where('partnerId', result1SampleSite.partnerId)
          .where('id', '<>', result1.siteId)
          .first()

        deviceApiResponse = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge(
            {},
            basicDevicePayload,
            { name: deviceName },
            basicResultPayload,
            {
              result: {
                data: { a: 'b', c: 2, d: false, e: { f: 'g' } },
                type: { id: 'Study' },
                source: { id: 'EnteredByHand' },
                workflow: { status: { id: 'Acknowledged' } },
                category: [{ id: 'Detected' }, { id: 'Indeterminate' }],
                assay: {
                  id: 'GxMtbRif',
                  version: '1a.c1',
                },
                startedOn: subMinutes(now, 5),
                endedOn: now,
                sample: {
                  id: "Bryan's Sputum",
                  type: {
                    id: 'Plasma',
                  },
                  originSite: {
                    id: result2SampleSite.externalId,
                  },
                },
                location: {
                  longitude: -87.581222,
                  latitude: 30.419348,
                },
                consumable: {
                  serial: '132-44-222',
                  expirationDate: '2014-03-01',
                  lot: '331-1',
                },
                instrument: {
                  serial: 'CEPH-PC-7813',
                  module: {
                    name: 'ModA',
                    serial: '555-8',
                  },
                },
                research: { id: 'R123' },
                patient: {
                  id: 'P-333',
                  name: 'Bob',
                  surname: 'Hope',
                  gender: 'M',
                  age: 72,
                  dateOfBirth: '1903-05-29',
                  address: '123 Main Street',
                  phone: '856-7909',
                },
                oemData: JSON.stringify({
                  maker: 'ABC',
                  model: '123A',
                  serial: '123-456-789',
                }),
                rawData: JSON.stringify({
                  startedOn: '2013-05-13',
                  endedOn: '2013-12-01T01:30',
                  patientData: {
                    id: 'P-333',
                    name: 'Bob',
                    surname: 'Hope',
                    gender: 'M',
                    age: 72,
                    dateOfBirth: '1903-05-29',
                    address: '123 Main Street',
                    phone: '856-7909',
                  },
                  location: {
                    longitude: -87.581222,
                    latitude: 30.419348,
                  },
                }),
                sender: {
                  version: '99-1',
                  operator: 'Bob O',
                },
                notes: 'My Awesome notes about this Awesome result!',
                error: {
                  code: '123',
                  notes: 'Oh NOZE!',
                },
              },
            }
          ),
          expectedStatusCode: 200,
        })
        lastResultId = deviceApiResponse.body.result.id
        assert.equal(lastResultId, resultIds[1])

        result2 = await knex('Result as r')
          .where({ id: resultIds[1] })
          .first()
        assert.equal(initialCount + 2, await countResults())
        expect(JSON.parse(result2.resultData)).to.containSubset({
          a: 'b',
          c: 2,
          d: false,
          e: { f: 'g' },
        })
        assert.equal(result2.assayVersion, '1a.c1')
        assert.approximately(result2.latitude, 30.419348, 0.000001)
        assert.approximately(result2.longitude, -87.581222, 0.000001)
        assert.equal(result2.consumableSerial, '132-44-222')
        assert.deepEqual(
          result2.consumableExpirationDate,
          new Date('2014-03-01')
        )
        assert.equal(result2.consumableLot, '331-1')
        assert.equal(result2.instrumentSerial, 'CEPH-PC-7813')
        assert.equal(result2.moduleName, 'ModA')
        assert.equal(result2.moduleSerial, '555-8')
        assert.equal(result2.researchId, 'R123')
        assert.deepEqual(JSON.parse(result2.patientData), {
          id: 'P-333',
          name: 'Bob',
          surname: 'Hope',
          gender: 'M',
          age: 72,
          dateOfBirth: '1903-05-29T00:00:00.000Z',
          address: '123 Main Street',
          phone: '856-7909',
        })
        assert.deepEqual(JSON.parse(result2.oemData), {
          maker: 'ABC',
          model: '123A',
          serial: '123-456-789',
        })
        assert.deepEqual(JSON.parse(result2.rawData), {
          startedOn: '2013-05-13',
          endedOn: '2013-12-01T01:30',
          patientData: {
            id: 'P-333',
            name: 'Bob',
            surname: 'Hope',
            gender: 'M',
            age: 72,
            dateOfBirth: '1903-05-29',
            address: '123 Main Street',
            phone: '856-7909',
          },
          location: {
            longitude: -87.581222,
            latitude: 30.419348,
          },
        })
        assert.equal(result2.senderVersion, '99-1')
        assert.equal(result2.senderOperator, 'Bob O')
        assert.equal(
          result2.notes,
          'My Awesome notes about this Awesome result!'
        )
        assert.equal(result2.errorCode, '123')
        assert.equal(result2.errorNotes, 'Oh NOZE!')

        const result2Type = await knex('ResultType as rt')
          .where({ id: result2.resultTypeId })
          .first('externalId')
        assert.equal(result2Type.externalId, 'Study')

        const result2Source = await knex('ResultSource as rs')
          .where({ id: result2.resultSourceId })
          .first('externalId')
        assert.equal(result2Source.externalId, 'EnteredByHand')

        const result2Status = await knex('ResultWorkflowStatus as rs')
          .where({ id: result2.resultWorkflowStatusId })
          .first('externalId')
        assert.equal(result2Status.externalId, 'Acknowledged')

        const result2Assay = await knex('Assay as assay')
          .where({ id: result2.assayId })
          .first('externalId', 'name')
        assert.equal(result2Assay.externalId, 'GxMtbRif')
        assert.equal(result2Assay.name, 'GeneXpert MTB/Rif')

        const result2Sample = await knex('Sample as s')
          .where({ id: result2.sampleId })
          .first()

        assert.notEqual(result2.siteId, result2Sample.originSiteId)
        assert.equal(result2SampleSite.id, result2Sample.originSiteId)
        assert.equal(result2Sample.externalId, "Bryan's Sputum")

        const [result2Category1, result2Category2] = await knex(
          'ResultCategory as rt'
        )
          .whereIn('id', [result2.resultCategory1, result2.resultCategory2])
          .select('externalId')
        assert.equal(result2Category1.externalId, 'Detected')
        assert.equal(result2Category2.externalId, 'Indeterminate')
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
        await Promise.each(
          Object.keys(resultTextToResultCategoryMapping),
          async resultText => {
            // Running these requests in parallel causes the connection pool in MySQL to fill up too quickly.
            // This is probably due to the fact table updates.
            // For now: sending these requests sequentially and sweeping this under the rug
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
              runNumber += 1
              await sendResult(
                resultId,
                assay,
                resultText,
                resultCategory1,
                resultCategory2,
                runNumber
              )
            } else {
              await Promise.resolve()
            }
          }
        )
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

    it('should respond the result that has been updated', () =>
      runTest(async () => {
        const { now } = context
        const resultId = 'A_RESULT_ID'
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
                startedOn: setMilliseconds(subDays(now, 3), 0),
              },
            }
          ),
        })
        assert.equal(
          JSON.parse(response.body.result.resultData).geneXpertTestId,
          resultId
        )
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
                  startedOn: subHours(testStartedOn, 2),
                  endedOn: testStartedOn,
                  assay: {
                    id: assayName,
                    version: assayVersion,
                  },
                  instrument: {
                    serial: '20345230',
                  },
                  sample: {
                    id: 'Sample with Unknown Assay',
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
          ;[inventoryItemId] = await knex('InventoryItem').insert({
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

          const { id: lastResultId } = response.body.result
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
            const consumableAssays = await knex('ConsumableAssay as ca')
              .join('Assay as a', 'ca.assayId', 'a.id')
              .join('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
              .where({ 'dt.externalId': basicDevicePayload.type.id })
              .andWhere('ca.quantity', '>', 0)
              .select(
                'ca.consumableId',
                'ca.quantity',
                'a.externalId as assayId'
              )

            assert.isNotEmpty(consumableAssays)
            assert.isAbove(_.sumBy(consumableAssays, 'quantity'), 0)

            const inventoryItemBefore = await knex('InventoryItem')
              .where({ id: inventoryItemId })
              .first()

            const { now } = context
            const testStartedOn = setMilliseconds(
              subMinutes(
                subHours(now, Math.floor(Math.random() * 24)),
                Math.floor(Math.random() * 60)
              ),
              0
            )
            const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
            const sampleId = 'This test will reduce inventory once'
            const instrumentSerial = 'Same instrument serial'

            // Send first test
            const firstResponse = await postToDeviceApi({
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
                      id: _.head(consumableAssays).assayId,
                      version: '2',
                    },
                    sample: { id: sampleId },
                    instrument: { serial: instrumentSerial },
                    startedOn: testStartedOn,
                    endedOn: testEndedOn,
                  },
                }
              ),
              expectedStatusCode: 200,
            })
            const { siteId: siteIdFromFirstRequest } = await knex('Device as d')
              .where('d.id', firstResponse.body.device.id)
              .first('d.siteId')
            const {
              body: { result: { id: resultIdAfterFirstRequest } },
            } = firstResponse

            const inventoryItemsAfterFirstRequest = await knex('InventoryItem')
              .whereIn('consumableId', _.map(consumableAssays, 'consumableId'))
              .andWhere({
                siteId: siteIdFromFirstRequest,
                expiresOn: expiryDate,
              })
              .select()

            const inventoryItemAfterFirstRequest = _.find(
              inventoryItemsAfterFirstRequest,
              {
                id: inventoryItemId,
              }
            )
            expect(inventoryItemBefore.quantityOnHand).to.be.above(
              inventoryItemAfterFirstRequest.quantityOnHand
            )
            const inventoryLogsAfterFirstRequest = await knex(
              'InventoryLog as il'
            )
              .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
              .where({ inventoryItemId })
              .select(
                'il.consumableId',
                'il.siteId',
                'cr.name as consumableReason',
                'il.resultId',
                'il.quantity'
              )
            expect(inventoryLogsAfterFirstRequest).to.containSubset([
              {
                siteId: siteIdFromFirstRequest,
                consumableReason: 'Test Conducted',
                resultId: resultIdAfterFirstRequest,
              },
            ])
            const matchingConsumableAssayAfterFirstRequest = _.find(
              consumableAssays,
              {
                consumableId: _.head(inventoryLogsAfterFirstRequest)
                  .consumableId,
                quantity: _.head(inventoryLogsAfterFirstRequest).quantity,
              }
            )
            assert.isNotEmpty(matchingConsumableAssayAfterFirstRequest)

            // Send update to test
            const newResultData = {
              customFieldData: {
                '1': {
                  notAvailable: false,
                  label: 'HIV Status',
                  value: 'HIV Negative',
                },
                '2': {
                  notAvailable: false,
                  label: 'Visual Analysis',
                  value: 'Spotty',
                },
              },
            }
            const secondResponse = await postToDeviceApi({
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
                      id: _.head(consumableAssays).assayId,
                      version: '2',
                    },
                    sample: { id: sampleId },
                    instrument: { serial: instrumentSerial },
                    startedOn: testStartedOn,
                    endedOn: testEndedOn,
                    data: newResultData,
                  },
                }
              ),
              expectedStatusCode: 200,
            })
            const { siteId: siteIdFromSecondRequest } = await knex(
              'Device as d'
            )
              .where('d.id', secondResponse.body.device.id)
              .first('d.siteId')
            assert.equal(siteIdFromSecondRequest, siteIdFromFirstRequest)
            const {
              body: { result: { id: resultIdAfterSecondRequest } },
            } = secondResponse
            assert.equal(resultIdAfterSecondRequest, resultIdAfterFirstRequest)

            const inventoryItemsAfterSecondRequest = await knex('InventoryItem')
              .whereIn('consumableId', _.map(consumableAssays, 'consumableId'))
              .andWhere({
                siteId: siteIdFromSecondRequest,
                expiresOn: expiryDate,
              })
              .select()

            const inventoryItemAfterSecondRequest = _.find(
              inventoryItemsAfterSecondRequest,
              {
                id: inventoryItemId,
              }
            )
            assert.equal(
              inventoryItemAfterFirstRequest.quantityOnHand,
              inventoryItemAfterSecondRequest.quantityOnHand
            )
            const inventoryLogsAfterSecondRequest = await knex(
              'InventoryLog as il'
            )
              .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
              .where({ inventoryItemId })
              .select(
                'il.consumableId',
                'il.siteId',
                'cr.name as consumableReason',
                'il.resultId',
                'il.quantity'
              )
            assert.deepEqual(
              inventoryLogsAfterSecondRequest,
              inventoryLogsAfterFirstRequest
            )
            const matchingConsumableAssayAfterSecondRequest = _.find(
              consumableAssays,
              {
                consumableId: _.head(inventoryLogsAfterSecondRequest)
                  .consumableId,
                quantity: _.head(inventoryLogsAfterSecondRequest).quantity,
              }
            )
            assert.isNotEmpty(matchingConsumableAssayAfterSecondRequest)
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

  describe('inventory changes', () => {
    const gxAlertDeviceId = 4412
    const deviceName = 'GeneXpert Device with Inventory Changes'
    const context = createContext()
    const {
      beforeCreateGxAlertApiKey,
      useGxAlertDeviceId,
      runTest,
      getCurrentGeneXpertDevice,
      afterCleanUp,
    } = context
    let { deviceAuth, basicDevicePayload } = context
    let geneXpertDevice
    before(async () =>
      run(async () => {
        await beforeCreateGxAlertApiKey()
        useGxAlertDeviceId(gxAlertDeviceId)
        ;({ deviceAuth, basicDevicePayload } = context)
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
          }),
        })
        geneXpertDevice = await getCurrentGeneXpertDevice()
      })
    )
    after(afterCleanUp)

    it('should create inventory items that do not exist', () =>
      runTest(async knex => {
        const { now } = context
        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: geneXpertDevice.siteId })
          .select()
        assert.isEmpty(inventoryItemsAtSiteBefore)

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const expirationDate = new Date(addYears(now, 1).setHours(0, 0, 0, 0))
        const consumableName = 'Xpert HIV-1 Qual Cartridge'
        const consumableReason = 'Captured'
        const initialQuantity = 100
        const quantity = 5

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: {
                inventoryChanges: [
                  {
                    consumableName,
                    consumableReasonName: consumableReason,
                    quantity,
                    resultingQuantityOnHand: initialQuantity + quantity,
                    dateChanged: startedOn,
                    expirationDate,
                  },
                ],
              },
            },
          }),
        })

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        expect(inventoryItemsAtSiteAfter).to.containSubset([
          {
            consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: expirationDate,
            quantityOnHand: initialQuantity + quantity,
          },
        ])

        const inventoryLog = await knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .join('Consumable as c', 'il.consumableId', 'c.id')
          .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
          .select(
            'c.name as consumableName',
            'il.siteId',
            'cr.name as consumableReason',
            'il.resultId',
            'il.operation',
            'il.lotNumber',
            'il.expiresOn',
            'il.quantity',
            'il.notes',
            'il.adjustedFrom',
            'il.adjustedTo'
          )

        assert.deepEqual(inventoryLog, [
          {
            consumableName,
            siteId: geneXpertDevice.siteId,
            consumableReason,
            resultId: null,
            operation: 'add from GxConnect',
            lotNumber: null,
            expiresOn: expirationDate,
            quantity,
            notes: null,
            adjustedFrom: setMilliseconds(startedOn, 0),
            adjustedTo: null,
          },
        ])
      }))

    it('should respond the inventory items that have been updated', () =>
      runTest(async () => {
        const { now } = context
        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const expirationDate = new Date(addYears(now, 1).setHours(0, 0, 0, 0))
        const consumableName = 'Xpert HIV-1 Qual Cartridge'
        const consumableReason = 'Captured'
        const initialQuantity = 100
        const quantity = 5

        const response = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: {
                inventoryChanges: [
                  {
                    consumableName,
                    consumableReasonName: consumableReason,
                    quantity,
                    resultingQuantityOnHand: initialQuantity + quantity,
                    dateChanged: startedOn,
                    expirationDate,
                  },
                ],
              },
            },
          }),
        })
        expect(response.body.inventoryItems).to.containSubset([
          {
            consumableName,
            quantityOnHand: initialQuantity + quantity,
            expiresOn: expirationDate.toJSON(),
          },
        ])
      }))

    it('should ignore changes for consumables that are unknown', () =>
      runTest(async knex => {
        const { now } = context
        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: geneXpertDevice.siteId })
          .select()

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const expirationDate = new Date(addYears(now, 1).setHours(0, 0, 0, 0))

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: {
                inventoryChanges: [
                  {
                    consumableName: 'Unknown consumable type',
                    consumableReasonName: 'Captured',
                    quantity: 12,
                    resultingQuantityOnHand: 112,
                    dateChanged: startedOn,
                    expirationDate,
                  },
                ],
              },
            },
          }),
        })

        const inventoryItemsAtSiteAfter = await knex('InventoryItem')
          .where({ siteId: geneXpertDevice.siteId })
          .select()
        assert.deepEqual(inventoryItemsAtSiteBefore, inventoryItemsAtSiteAfter)
      }))

    it('should accept all types of GeneXpert cartridges', () =>
      runTest(async knex => {
        const { now } = context
        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: geneXpertDevice.siteId })
          .pluck('id')

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const consumableReason = 'Captured'

        const inventoryChanges = [
          {
            consumableName: 'GeneXpert TB Cartridge',
            consumableReasonName: consumableReason,
            quantity: 13,
            resultingQuantityOnHand: 86,
            dateChanged: addHours(startedOn, 1),
            expirationDate: new Date(
              subDays(addYears(now, 1), 1).setHours(0, 0, 0, 0)
            ),
          },
          {
            consumableName: 'GeneXpert Ebola Cartridge',
            consumableReasonName: consumableReason,
            quantity: 3,
            resultingQuantityOnHand: 21,
            dateChanged: addHours(startedOn, 2),
            expirationDate: new Date(
              subDays(addYears(now, 1), 3).setHours(0, 0, 0, 0)
            ),
          },
          {
            consumableName: 'Xpert HIV-1 Qual Cartridge',
            consumableReasonName: consumableReason,
            quantity: 44,
            resultingQuantityOnHand: 50,
            dateChanged: addHours(startedOn, 3),
            expirationDate: new Date(
              subDays(addYears(now, 1), 3).setHours(0, 0, 0, 0)
            ),
          },
          {
            consumableName: 'Xpert HIV-1 Viral Load Cartridge',
            consumableReasonName: consumableReason,
            quantity: 1,
            resultingQuantityOnHand: 13,
            dateChanged: addHours(startedOn, 4),
            expirationDate: new Date(
              subDays(addYears(now, 1), 4).setHours(0, 0, 0, 0)
            ),
          },
          {
            consumableName: 'GeneXpert TB Ultra Cartridge',
            consumableReasonName: consumableReason,
            quantity: 26,
            resultingQuantityOnHand: 41,
            dateChanged: addHours(startedOn, 5),
            expirationDate: new Date(
              subDays(addYears(now, 1), 8).setHours(0, 0, 0, 0)
            ),
          },
        ]

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: { inventoryChanges },
            },
          }),
        })

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        expect(inventoryItemsAtSiteAfter).to.containSubset(
          _.map(inventoryChanges, inventoryChange => ({
            consumableName: inventoryChange.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: inventoryChange.expirationDate,
            quantityOnHand: inventoryChange.resultingQuantityOnHand,
          }))
        )

        const inventoryLog = await knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .join('Consumable as c', 'il.consumableId', 'c.id')
          .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
          .select(
            'c.name as consumableName',
            'il.siteId',
            'cr.name as consumableReason',
            'il.resultId',
            'il.operation',
            'il.lotNumber',
            'il.expiresOn',
            'il.quantity',
            'il.notes',
            'il.adjustedFrom',
            'il.adjustedTo'
          )

        expect(inventoryLog).to.containSubset(
          _.map(inventoryChanges, inventoryChange => ({
            consumableName: inventoryChange.consumableName,
            siteId: geneXpertDevice.siteId,
            consumableReason,
            resultId: null,
            operation: 'add from GxConnect',
            lotNumber: null,
            expiresOn: inventoryChange.expirationDate,
            quantity: Math.abs(inventoryChange.quantity),
            notes: null,
            adjustedFrom: setMilliseconds(inventoryChange.dateChanged, 0),
            adjustedTo: null,
          }))
        )
      }))

    it('should increase the quantity inventory items that do exist', () =>
      runTest(async knex => {
        const { now } = context
        const inventoryItemAtSiteBefore = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .orderBy(['ii.createdOn', 'ii.id'])
          .first(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        assert.isNotEmpty(inventoryItemAtSiteBefore)

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const consumableReason = 'Captured'
        const quantity = 13

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: {
                inventoryChanges: [
                  {
                    consumableName: inventoryItemAtSiteBefore.consumableName,
                    consumableReasonName: consumableReason,
                    quantity,
                    resultingQuantityOnHand:
                      inventoryItemAtSiteBefore.quantityOnHand + quantity,
                    dateChanged: startedOn,
                    expirationDate: inventoryItemAtSiteBefore.expiresOn,
                  },
                ],
              },
            },
          }),
        })

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ 'ii.id': inventoryItemAtSiteBefore.id })
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        expect(inventoryItemsAtSiteAfter).to.containSubset([
          {
            consumableName: inventoryItemAtSiteBefore.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: inventoryItemAtSiteBefore.expiresOn,
            quantityOnHand: inventoryItemAtSiteBefore.quantityOnHand + quantity,
          },
        ])

        const inventoryLog = await knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .join('Consumable as c', 'il.consumableId', 'c.id')
          .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
          .orderBy('il.id', 'desc')
          .first(
            'c.name as consumableName',
            'il.siteId',
            'cr.name as consumableReason',
            'il.resultId',
            'il.operation',
            'il.lotNumber',
            'il.expiresOn',
            'il.quantity',
            'il.notes',
            'il.adjustedFrom',
            'il.adjustedTo'
          )

        expect(inventoryLog).to.containSubset({
          consumableName: inventoryItemAtSiteBefore.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason,
          resultId: null,
          operation: 'add from GxConnect',
          lotNumber: null,
          expiresOn: inventoryItemAtSiteBefore.expiresOn,
          quantity,
          notes: null,
          adjustedFrom: setMilliseconds(startedOn, 0),
          adjustedTo: null,
        })
      }))

    it('should decrease the quantity on hand of existing inventory items', () =>
      runTest(async knex => {
        const { now } = context
        const inventoryItemAtSiteBefore = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .orderBy(['ii.createdOn', 'ii.id'])
          .first(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        assert.isNotEmpty(inventoryItemAtSiteBefore)

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const consumableReason = 'Captured'
        const quantity = -3

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: {
                inventoryChanges: [
                  {
                    consumableName: inventoryItemAtSiteBefore.consumableName,
                    consumableReasonName: consumableReason,
                    quantity,
                    resultingQuantityOnHand:
                      inventoryItemAtSiteBefore.quantityOnHand + quantity,
                    dateChanged: startedOn,
                    expirationDate: inventoryItemAtSiteBefore.expiresOn,
                  },
                ],
              },
            },
          }),
        })

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ 'ii.id': inventoryItemAtSiteBefore.id })
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )

        expect(inventoryItemsAtSiteAfter).to.containSubset([
          {
            consumableName: inventoryItemAtSiteBefore.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: inventoryItemAtSiteBefore.expiresOn,
            quantityOnHand: inventoryItemAtSiteBefore.quantityOnHand + quantity,
          },
        ])

        const inventoryLog = await knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .join('Consumable as c', 'il.consumableId', 'c.id')
          .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
          .orderBy('il.id', 'desc')
          .first(
            'c.name as consumableName',
            'il.siteId',
            'cr.name as consumableReason',
            'il.resultId',
            'il.operation',
            'il.lotNumber',
            'il.expiresOn',
            'il.quantity',
            'il.notes',
            'il.adjustedFrom',
            'il.adjustedTo'
          )

        expect(inventoryLog).to.containSubset({
          consumableName: inventoryItemAtSiteBefore.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason,
          resultId: null,
          operation: 'remove from GxConnect',
          lotNumber: null,
          expiresOn: inventoryItemAtSiteBefore.expiresOn,
          quantity: Math.abs(quantity),
          notes: null,
          adjustedFrom: setMilliseconds(startedOn, 0),
          adjustedTo: null,
        })
      }))

    it('should accept different reasons', () =>
      runTest(async knex => {
        const { now } = context
        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: geneXpertDevice.siteId })
          .pluck('id')

        const startedOn = subDays(now, 1)
        const endedOn = addHours(startedOn, 2)

        const inventoryChanges = [
          {
            consumableName: 'GeneXpert TB Cartridge',
            consumableReasonName: 'Captured',
            quantity: 13,
            resultingQuantityOnHand: 73,
            dateChanged: subHours(startedOn, 1),
            expirationDate: new Date(
              subDays(addYears(now, 1), 5).setHours(0, 0, 0, 0)
            ),
          },
          {
            consumableName: 'GeneXpert Ebola Cartridge',
            consumableReasonName: 'Captured',
            quantity: -3,
            resultingQuantityOnHand: 18,
            dateChanged: subHours(startedOn, 2),
            expirationDate: new Date(
              subDays(addYears(now, 1), 6).setHours(0, 0, 0, 0)
            ),
          },
          {
            consumableName: 'Xpert HIV-1 Qual Cartridge',
            consumableReasonName: 'Transfer Sent',
            quantity: -4,
            resultingQuantityOnHand: 46,
            dateChanged: subHours(startedOn, 3),
            expirationDate: new Date(
              subDays(addYears(now, 1), 8).setHours(0, 0, 0, 0)
            ),
          },
          {
            consumableName: 'Xpert HIV-1 Viral Load Cartridge',
            consumableReasonName: 'Transfer Received',
            quantity: 11,
            resultingQuantityOnHand: 24,
            dateChanged: subHours(startedOn, 4),
            expirationDate: new Date(
              subDays(addYears(now, 1), 3).setHours(0, 0, 0, 0)
            ),
          },
          {
            consumableName: 'GeneXpert TB Ultra Cartridge',
            consumableReasonName: 'Lost',
            quantity: -6,
            resultingQuantityOnHand: 30,
            dateChanged: subHours(startedOn, 5),
            expirationDate: new Date(
              subDays(addYears(now, 1), 7).setHours(0, 0, 0, 0)
            ),
          },
          {
            consumableName: 'GeneXpert TB Cartridge',
            consumableReasonName: 'Expired',
            quantity: -6,
            resultingQuantityOnHand: 50,
            dateChanged: subHours(startedOn, 6),
            expirationDate: new Date(
              subDays(addYears(now, 1), 2).setHours(0, 0, 0, 0)
            ),
          },
        ]

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: { inventoryChanges },
            },
          }),
        })

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        expect(inventoryItemsAtSiteAfter).to.containSubset(
          _.map(inventoryChanges, inventoryChange => ({
            consumableName: inventoryChange.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: inventoryChange.expirationDate,
            quantityOnHand: inventoryChange.resultingQuantityOnHand,
          }))
        )

        const inventoryLog = await knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .join('Consumable as c', 'il.consumableId', 'c.id')
          .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
          .select(
            'c.name as consumableName',
            'il.siteId',
            'cr.name as consumableReason',
            'il.resultId',
            'il.operation',
            'il.lotNumber',
            'il.expiresOn',
            'il.quantity',
            'il.notes',
            'il.adjustedFrom',
            'il.adjustedTo'
          )

        expect(inventoryLog).to.containSubset(
          _.map(inventoryChanges, inventoryChange => ({
            consumableName: inventoryChange.consumableName,
            siteId: geneXpertDevice.siteId,
            consumableReason: inventoryChange.consumableReasonName,
            resultId: null,
            operation:
              inventoryChange.quantity >= 0
                ? 'add from GxConnect'
                : 'remove from GxConnect',
            lotNumber: null,
            expiresOn: inventoryChange.expirationDate,
            quantity: Math.abs(inventoryChange.quantity),
            notes: null,
            adjustedFrom: setMilliseconds(inventoryChange.dateChanged, 0),
            adjustedTo: null,
          }))
        )
      }))

    it('should identify lots based on expiration date and adjust the quantity of the correct lot', () =>
      runTest(async knex => {
        const { now } = context
        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: geneXpertDevice.siteId })
          .pluck('id')

        const startedOn = subDays(now, 5)
        const endedOn = addHours(startedOn, 2)

        const lot1 = {
          consumableName: 'GeneXpert TB Cartridge',
          consumableReasonName: 'Captured',
          quantity: 73,
          resultingQuantityOnHand: 73,
          dateChanged: subHours(startedOn, 2),
          expirationDate: new Date(
            subDays(addYears(now, 1), 21).setHours(0, 0, 0, 0)
          ),
        }
        const lot2 = {
          consumableName: 'GeneXpert TB Cartridge',
          consumableReasonName: 'Captured',
          quantity: 38,
          resultingQuantityOnHand: 38,
          dateChanged: subHours(startedOn, 2),
          expirationDate: new Date(
            subDays(addYears(now, 1), 33).setHours(0, 0, 0, 0)
          ),
        }

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: { inventoryChanges: [lot1, lot2] },
            },
          }),
        })

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        expect(inventoryItemsAtSiteAfter).to.containSubset(
          _.map([lot1, lot2], inventoryChange => ({
            consumableName: inventoryChange.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: inventoryChange.expirationDate,
            quantityOnHand: inventoryChange.resultingQuantityOnHand,
          }))
        )

        const inventoryLogs = await knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .join('Consumable as c', 'il.consumableId', 'c.id')
          .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
          .select(
            'il.id',
            'c.name as consumableName',
            'il.siteId',
            'cr.name as consumableReason',
            'il.resultId',
            'il.operation',
            'il.lotNumber',
            'il.expiresOn',
            'il.quantity',
            'il.notes',
            'il.adjustedFrom',
            'il.adjustedTo'
          )

        expect(inventoryLogs).to.containSubset(
          _.map([lot1, lot2], inventoryChange => ({
            consumableName: inventoryChange.consumableName,
            siteId: geneXpertDevice.siteId,
            consumableReason: inventoryChange.consumableReasonName,
            resultId: null,
            operation:
              inventoryChange.quantity >= 0
                ? 'add from GxConnect'
                : 'remove from GxConnect',
            lotNumber: null,
            expiresOn: inventoryChange.expirationDate,
            quantity: Math.abs(inventoryChange.quantity),
            notes: null,
            adjustedFrom: setMilliseconds(inventoryChange.dateChanged, 0),
            adjustedTo: null,
          }))
        )

        const updateToLot1 = _.assign({}, lot1, {
          consumableReasonName: 'Stolen',
          quantity: -3,
          resultingQuantityOnHand: 70,
          dateChanged: subHours(startedOn, 1),
        })

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: { inventoryChanges: [updateToLot1] },
            },
          }),
        })

        const lot1InventoryItem = _.find(inventoryItemsAtSiteAfter, {
          expiresOn: lot1.expirationDate,
        })
        const lot2InventoryItem = _.find(inventoryItemsAtSiteAfter, {
          expiresOn: lot2.expirationDate,
        })
        const lot1InventoryItemAfterAdjustment1 = await knex(
          'InventoryItem as ii'
        )
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ 'ii.id': lot1InventoryItem.id })
          .first(
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        const lot2InventoryItemAfterAdjustment1 = await knex(
          'InventoryItem as ii'
        )
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ 'ii.id': lot2InventoryItem.id })
          .first(
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        assert.deepEqual(lot1InventoryItemAfterAdjustment1, {
          consumableName: lot1.consumableName,
          inTransitFromSiteId: null,
          lotNumber: null,
          expiresOn: lot1.expirationDate,
          quantityOnHand:
            lot1InventoryItem.quantityOnHand + updateToLot1.quantity,
        })
        assert.deepEqual(lot2InventoryItemAfterAdjustment1, {
          consumableName: lot2.consumableName,
          inTransitFromSiteId: null,
          lotNumber: null,
          expiresOn: lot2.expirationDate,
          quantityOnHand: lot2.resultingQuantityOnHand,
        })

        const updateToLot2 = _.assign({}, lot2, {
          consumableReasonName: 'Transfer Received',
          quantity: 100,
          resultingQuantityOnHand: 138,
          dateChanged: subHours(startedOn, 1),
        })

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: { inventoryChanges: [updateToLot2] },
            },
          }),
        })

        const lot1InventoryItemAfterAdjustment2 = await knex(
          'InventoryItem as ii'
        )
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ 'ii.id': lot1InventoryItem.id })
          .first(
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        const lot2InventoryItemAfterAdjustment2 = await knex(
          'InventoryItem as ii'
        )
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ 'ii.id': lot2InventoryItem.id })
          .first(
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        assert.deepEqual(lot1InventoryItemAfterAdjustment2, {
          consumableName: lot1.consumableName,
          inTransitFromSiteId: null,
          lotNumber: null,
          expiresOn: lot1.expirationDate,
          quantityOnHand:
            lot1InventoryItem.quantityOnHand + updateToLot1.quantity,
        })
        assert.deepEqual(lot2InventoryItemAfterAdjustment2, {
          consumableName: lot2.consumableName,
          inTransitFromSiteId: null,
          lotNumber: null,
          expiresOn: lot2.expirationDate,
          quantityOnHand:
            lot2InventoryItem.quantityOnHand + updateToLot2.quantity,
        })
        const inventoryLogsForLot1And2 = await knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .join('Consumable as c', 'il.consumableId', 'c.id')
          .whereIn('il.inventoryItemId', [
            lot1InventoryItem.id,
            lot2InventoryItem.id,
          ])
          .orderBy('il.id')
          .select(
            'c.name as consumableName',
            'il.siteId',
            'cr.name as consumableReason',
            'il.resultId',
            'il.operation',
            'il.lotNumber',
            'il.expiresOn',
            'il.quantity',
            'il.notes',
            'il.adjustedFrom',
            'il.adjustedTo'
          )
        expect(inventoryLogsForLot1And2).to.containSubset([
          {
            consumableName: lot1.consumableName,
            siteId: geneXpertDevice.siteId,
            consumableReason: lot1.consumableReasonName,
            resultId: null,
            operation: 'add from GxConnect',
            lotNumber: null,
            expiresOn: lot1.expirationDate,
            quantity: Math.abs(lot1.resultingQuantityOnHand),
            notes: null,
            adjustedFrom: setMilliseconds(lot1.dateChanged, 0),
            adjustedTo: null,
          },
          {
            consumableName: lot2.consumableName,
            siteId: geneXpertDevice.siteId,
            consumableReason: lot2.consumableReasonName,
            resultId: null,
            operation: 'add from GxConnect',
            lotNumber: null,
            expiresOn: lot2.expirationDate,
            quantity: Math.abs(lot2.resultingQuantityOnHand),
            notes: null,
            adjustedFrom: setMilliseconds(lot2.dateChanged, 0),
            adjustedTo: null,
          },
          {
            consumableName: lot1.consumableName,
            siteId: geneXpertDevice.siteId,
            consumableReason: updateToLot1.consumableReasonName,
            resultId: null,
            operation: 'remove from GxConnect',
            lotNumber: null,
            expiresOn: lot1.expirationDate,
            quantity: Math.abs(updateToLot1.quantity),
            notes: null,
            adjustedFrom: setMilliseconds(updateToLot1.dateChanged, 0),
            adjustedTo: null,
          },
          {
            consumableName: lot2.consumableName,
            siteId: geneXpertDevice.siteId,
            consumableReason: updateToLot2.consumableReasonName,
            resultId: null,
            operation: 'add from GxConnect',
            lotNumber: null,
            expiresOn: lot2.expirationDate,
            quantity: Math.abs(updateToLot2.quantity),
            notes: null,
            adjustedFrom: setMilliseconds(updateToLot2.dateChanged, 0),
            adjustedTo: null,
          },
        ])
      }))

    describe('when quantity on hand is explicitly specified in the data', () => {
      it('should overwrite the quantity on hand in the inventory record', () =>
        runTest(async knex => {
          const { now } = context
          const inventoryItemsAtSiteBefore = await knex('InventoryItem')
            .where({ siteId: geneXpertDevice.siteId })
            .pluck('id')

          const startedOn = subDays(now, 7)
          const endedOn = addHours(startedOn, 2)
          const expirationDate = new Date(
            subDays(addYears(now, 1), 16).setHours(0, 0, 0, 0)
          )

          const initialLotCaptured = {
            consumableName: 'GeneXpert TB Cartridge',
            consumableReasonName: 'Captured',
            quantity: 25,
            resultingQuantityOnHand: 25,
            dateChanged: subHours(startedOn, 2),
            expirationDate,
          }

          await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge({}, basicDevicePayload, {
              name: deviceName,
              operation: {
                startedOn,
                endedOn,
                data: { inventoryChanges: [initialLotCaptured] },
              },
            }),
          })

          const inventoryItemsAtSiteAfterCapture = await knex(
            'InventoryItem as ii'
          )
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: geneXpertDevice.siteId })
            .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
            .select(
              'ii.id',
              'c.name as consumableName',
              'ii.inTransitFromSiteId',
              'ii.lotNumber',
              'ii.expiresOn',
              'ii.quantityOnHand'
            )
          expect(inventoryItemsAtSiteAfterCapture).to.containSubset([
            {
              consumableName: initialLotCaptured.consumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: initialLotCaptured.expirationDate,
              quantityOnHand: initialLotCaptured.resultingQuantityOnHand,
            },
          ])

          const inventoryLost = {
            consumableName: 'GeneXpert TB Cartridge',
            consumableReasonName: 'Lost',
            quantity: -5,
            resultingQuantityOnHand: 999,
            dateChanged: subHours(startedOn, 1),
            expirationDate,
          }

          await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge({}, basicDevicePayload, {
              name: deviceName,
              operation: {
                startedOn,
                endedOn,
                data: { inventoryChanges: [inventoryLost] },
              },
            }),
          })

          const inventoryItemsAtSiteAfterLoss = await knex(
            'InventoryItem as ii'
          )
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: geneXpertDevice.siteId })
            .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
            .select(
              'ii.id',
              'c.name as consumableName',
              'ii.inTransitFromSiteId',
              'ii.lotNumber',
              'ii.expiresOn',
              'ii.quantityOnHand'
            )
          expect(inventoryItemsAtSiteAfterLoss).to.containSubset([
            {
              consumableName: inventoryLost.consumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: inventoryLost.expirationDate,
              quantityOnHand: inventoryLost.resultingQuantityOnHand,
            },
          ])
        }))
    })

    describe('when quantity on hand is not specified in the data', () => {
      it('should calculate the quantity on hand in the inventory record', () =>
        runTest(async knex => {
          const { now } = context
          const inventoryItemsAtSiteBefore = await knex('InventoryItem')
            .where({ siteId: geneXpertDevice.siteId })
            .pluck('id')

          const startedOn = subDays(now, 9)
          const endedOn = addHours(startedOn, 2)
          const expirationDate = new Date(
            subDays(addYears(now, 1), 15).setHours(0, 0, 0, 0)
          )

          const initialLotCaptured = {
            consumableName: 'GeneXpert TB Cartridge',
            consumableReasonName: 'Captured',
            quantity: 25,
            dateChanged: subHours(startedOn, 2),
            expirationDate,
          }

          await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge({}, basicDevicePayload, {
              name: deviceName,
              operation: {
                startedOn,
                endedOn,
                data: { inventoryChanges: [initialLotCaptured] },
              },
            }),
          })

          const inventoryItemsAtSiteAfterCapture = await knex(
            'InventoryItem as ii'
          )
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: geneXpertDevice.siteId })
            .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
            .select(
              'ii.id',
              'c.name as consumableName',
              'ii.inTransitFromSiteId',
              'ii.lotNumber',
              'ii.expiresOn',
              'ii.quantityOnHand'
            )
          expect(inventoryItemsAtSiteAfterCapture).to.containSubset([
            {
              consumableName: initialLotCaptured.consumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: initialLotCaptured.expirationDate,
              quantityOnHand: initialLotCaptured.quantity,
            },
          ])

          const inventoryLost = {
            consumableName: 'GeneXpert TB Cartridge',
            consumableReasonName: 'Lost',
            quantity: -5,
            dateChanged: subHours(startedOn, 1),
            expirationDate,
          }

          await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge({}, basicDevicePayload, {
              name: deviceName,
              operation: {
                startedOn,
                endedOn,
                data: { inventoryChanges: [inventoryLost] },
              },
            }),
          })

          const inventoryItemsAtSiteAfterLoss = await knex(
            'InventoryItem as ii'
          )
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: geneXpertDevice.siteId })
            .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
            .select(
              'ii.id',
              'c.name as consumableName',
              'ii.inTransitFromSiteId',
              'ii.lotNumber',
              'ii.expiresOn',
              'ii.quantityOnHand'
            )
          expect(inventoryItemsAtSiteAfterLoss).to.containSubset([
            {
              consumableName: inventoryLost.consumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: inventoryLost.expirationDate,
              quantityOnHand:
                initialLotCaptured.quantity + inventoryLost.quantity,
            },
          ])
        }))
    })
  })
})
