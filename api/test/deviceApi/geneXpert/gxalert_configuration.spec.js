const _ = require('lodash')
const chai = require('chai')
const chaiSubset = require('chai-subset')
const { setMilliseconds, subMinutes, subHours, addDays, startOfToday, format: dateFormat } = require('date-fns')

const { createGxAlertTestContext } = require('./gxalert_utils')
const { postToDeviceApi, getMaxDeviceId, getDeviceType, getDevicesWithIdLargerThan } = require('../utils')
const { knex } = require('../../../src/db')
const { allDeviceMaintenanceStatusToId } = require('../../../src/shared/dictionary')
const { getLocalDateInUtc } = require('../../../src/shared/date')
const { waitForApproximately } = require('../../utils/generatorFunctionUtils')
const { waitForIdle, waitForAction } = require('../../utils/mqUtils')
const { deviceSeen, deviceMaintenance, types } = require('../../../src/device/actions')
const { factGenerateDeviceConnectivity } = require('../../../src/fact/actions')

const server = require('../../utils/testUtils')

const { assert, expect } = chai.use(chaiSubset)

describe('Device API routes for GxAlert Device', () => {
  function createContext() {
    return createGxAlertTestContext(server)
  }

  describe('registration and configuration', () => {
    describe('when no device API key is specified', () => {
      const { basicDevicePayload } = createContext()
      it('should respond with UNAUTHORIZED', async () =>
        postToDeviceApi({
          authHeader: 'Bearer ',
          payload: basicDevicePayload,
          expectedStatusCode: 401,
        }))
    })

    describe('when an unknown device API key is specified', () => {
      const { basicDevicePayload } = createContext()
      it('should respond with UNAUTHORIZED', async () =>
        postToDeviceApi({
          authHeader: 'Bearer fg2g9cjx0njzgbfmkem0',
          payload: basicDevicePayload,
          expectedStatusCode: 401,
        }))
    })

    describe('when a known device API key is specified', () => {
      describe('send new device data', () => {
        describe('before a gxAlertDeviceId has been specified', () => {
          const context = createContext()
          const { beforeCreateGxAlertApiKey, afterCleanUp } = context
          before(beforeCreateGxAlertApiKey)
          after(afterCleanUp)

          it('should respond with BAD_REQUEST', async () => {
            const { deviceAuth, basicDevicePayload } = context
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload: basicDevicePayload,
              expectedResponseBody: {
                statusCode: 400,
                error: 'Bad Request',
                message: 'Must specify GxAlert device ID for data from GxAlert',
              },
            })
          })
        })

        describe('after a gxAlertDeviceId and deviceName have been specified', () => {
          const deviceName = 'GeneXpert Lab from GxAlert'
          const gxAlertDeviceId = 47
          let maxDeviceIdBefore = -1

          const context = createContext()
          const { beforeCreateGxAlertApiKey, useGxAlertDeviceId, afterCleanUp } = context

          beforeEach(async () => {
            maxDeviceIdBefore = await getMaxDeviceId(knex)
            await beforeCreateGxAlertApiKey()
            useGxAlertDeviceId(gxAlertDeviceId)
          })

          afterEach(afterCleanUp)

          it('should respond with OK and create a new GeneXpert device', async () => {
            const gxAlertDeviceType = await getDeviceType('GxAlert', knex)
            const geneXpertDeviceType = await getDeviceType('CepheidGeneXpert', knex)
            let devicesCreatedDuringTest = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)
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
            expect({
              ...response.body.device,
              configurationData: JSON.parse(response.body.device.configurationData),
            }).to.containSubset({
              name: deviceName,
              deviceTypeId: geneXpertDeviceType.id,
              macAddress: null,
              configurationData: { gxAlertDeviceId },
            })

            devicesCreatedDuringTest = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)

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
          })

          it('should have created a device and NOT link it to the device API key', async () => {
            const { apiKey } = context

            const deviceDetails = await knex('DeviceApiKey as dak')
              .join('Device as d', 'dak.DeviceId', 'd.id')
              .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
              .where({ 'dak.token': apiKey })
              .select('dt.externalId as deviceTypeExternalId', 'd.name')
            assert.deepEqual(
              _.map(deviceDetails, deviceDetail => deviceDetail.deviceTypeExternalId),
              ['GxAlert']
            )
            assert.notEqual(deviceDetails[0].name, deviceName)
          })
        })

        describe('when a new gxAlertDeviceId is specified', () => {
          const initialGxAlertDeviceId = 2012
          const deviceName = 'Some Laboratory'
          const deviceShortName = 'Some Lab'
          const macAddress = 'MAC00000INITIAL'
          const hostId = 'GXDevice5'
          const deviceSerialNumber = 'SERIAL1'
          const instrumentSerialNumbers = ['SERIAL2', 'SERIAL3']

          const context = createContext()
          const { beforeCreateGxAlertApiKey, useGxAlertDeviceId, getCurrentGeneXpertDevice, afterCleanUp } = context
          let { deviceAuth, basicDevicePayload } = context

          before(async () => {
            await beforeCreateGxAlertApiKey()
            useGxAlertDeviceId(initialGxAlertDeviceId)
            ;({ deviceAuth, basicDevicePayload } = context)
            const response = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                name: deviceName,
                configuration: {
                  data: {
                    shortName: deviceShortName,
                    macAddress,
                    hostId,
                    deviceSerialNumber,
                    instrumentSerialNumbers,
                  },
                },
              }),
            })
            expect({
              ...response.body.device,
              configurationData: JSON.parse(response.body.device.configurationData),
            }).to.containSubset({
              name: deviceName,
              shortName: deviceShortName,
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
              shortName: deviceShortName,
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

          after(afterCleanUp)

          describe('and other identifying properties already belong to another device', () => {
            it('should update the gxAlertDeviceId on the existing device', async () => {
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
              expect({
                ...response.body.device,
                configurationData: JSON.parse(response.body.device.configurationData),
              }).to.containSubset({
                name: deviceName,
                shortName: deviceShortName,
                macAddress,
                serial: deviceSerialNumber,
                hostId,
                configurationData: {
                  shortName: deviceShortName,
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
                shortName: deviceShortName,
                macAddress,
                serial: deviceSerialNumber,
                hostId,
                configurationData: {
                  shortName: deviceShortName,
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
                  shortName: deviceShortName,
                  macAddress,
                  serial: deviceSerialNumber,
                  hostId,
                  configurationData: {
                    shortName: deviceShortName,
                    macAddress,
                    deviceSerialNumber,
                    instrumentSerialNumbers,
                    hostId,
                    gxAlertDeviceId: newGxAlertDeviceId,
                  },
                },
              ])
            })
          })
        })
      })
    })

    describe('when the MAC address of the source device changes', () => {
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
        getCurrentGeneXpertDevice,
        afterCleanUp,
      } = context

      beforeEach(async () => {
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

      afterEach(afterCleanUp)

      describe('and gxAlertDeviceId changes', () => {
        it('should create a new device', async () => {
          const gxAlertDeviceType = await getDeviceType('GxAlert', knex)
          const geneXpertDeviceType = await getDeviceType('CepheidGeneXpert', knex)
          const devicesCreatedDuringTestBefore = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)
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
          expect({
            ...response.body.device,
            configurationData: JSON.parse(response.body.device.configurationData),
          }).to.containSubset({
            name: deviceName,
            deviceTypeId: geneXpertDeviceType.id,
            macAddress: secondMacAddress,
            configurationData: {
              gxAlertDeviceId: secondGxAlertDeviceId,
              macAddress: secondMacAddress,
            },
          })

          const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)
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
          expect(devicesCreatedDuringTestAfter).to.have.length(devicesCreatedDuringTestBefore.length + 1)
        })
      })

      describe('but gxAlertDeviceId remains the same', () => {
        it('should update the MAC address of the existing device', async () => {
          const gxAlertDeviceType = await getDeviceType('GxAlert', knex)
          const geneXpertDeviceType = await getDeviceType('CepheidGeneXpert', knex)
          const devicesCreatedDuringTestBefore = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)
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
          expect({
            ...response.body.device,
            configurationData: JSON.parse(response.body.device.configurationData),
          }).to.containSubset({
            name: deviceName,
            deviceTypeId: geneXpertDeviceType.id,
            macAddress: thirdMacAddress,
            configurationData: {
              macAddress: thirdMacAddress,
            },
          })

          const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)

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
              macAddress: thirdMacAddress,
              configurationData: {
                macAddress: thirdMacAddress,
                gxAlertDeviceId: firstGxAlertDeviceId,
              },
            },
          ])
          expect(devicesCreatedDuringTestAfter).to.have.length(devicesCreatedDuringTestBefore.length)
        })
      })

      describe("and collides with another device's MAC address", () => {
        it('should update the MAC address of the device, creating a duplicate MAC address', async () => {
          const gxAlertDeviceType = await getDeviceType('GxAlert', knex)
          const geneXpertDeviceType = await getDeviceType('CepheidGeneXpert', knex)
          const devicesCreatedDuringTestBefore = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)
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
          ])
          expect(devicesCreatedDuringTestBefore).to.have.length(2)

          useGxAlertDeviceId(secondGxAlertDeviceId)
          const { deviceAuth, basicDevicePayload } = context
          const responseForSecondDevice = await postToDeviceApi({
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
          expect({
            ...responseForSecondDevice.body.device,
            configurationData: JSON.parse(responseForSecondDevice.body.device.configurationData),
          }).to.containSubset({
            name: deviceName,
            deviceTypeId: geneXpertDeviceType.id,
            macAddress: secondMacAddress,
            configurationData: {
              gxAlertDeviceId: secondGxAlertDeviceId,
              macAddress: secondMacAddress,
            },
          })

          const devicesCreatedDuringTestAfterSecondMacAddress = await getDevicesWithIdLargerThan(
            maxDeviceIdBefore,
            knex
          )
          expect(devicesCreatedDuringTestAfterSecondMacAddress).to.have.length(
            devicesCreatedDuringTestBefore.length + 1
          )

          expect(devicesCreatedDuringTestAfterSecondMacAddress).to.containSubset([
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

          const responseAfterSecondDeviceUpdate = await postToDeviceApi({
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
          expect({
            ...responseAfterSecondDeviceUpdate.body.device,
            configurationData: JSON.parse(responseAfterSecondDeviceUpdate.body.device.configurationData),
          }).to.containSubset({
            name: deviceName,
            deviceTypeId: geneXpertDeviceType.id,
            macAddress: firstMacAddress,
            configurationData: {
              gxAlertDeviceId: secondGxAlertDeviceId,
              macAddress: firstMacAddress,
            },
          })

          const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)
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
          expect(devicesCreatedDuringTestAfter).to.have.length(devicesCreatedDuringTestAfterSecondMacAddress.length)
        })
      })

      describe('to NULL', () => {
        it('should not update the macAddress to NULL', async () => {
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
          expect({
            ...response.body.device,
            configurationData: JSON.parse(response.body.device.configurationData),
          }).to.containSubset({
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
          expect({
            ...nextResponse.body.device,
            configurationData: JSON.parse(nextResponse.body.device.configurationData),
          }).to.containSubset({
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
        })
      })
    })

    describe('when the instrument serial of the source device changes', () => {
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
        getCurrentGeneXpertDevice,
        afterCleanUp,
      } = context

      beforeEach(async () => {
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

      afterEach(afterCleanUp)

      describe('and gxAlertDeviceId changes', () => {
        it('should create a new device', async () => {
          const gxAlertDeviceType = await getDeviceType('GxAlert', knex)
          const geneXpertDeviceType = await getDeviceType('CepheidGeneXpert', knex)
          const devicesCreatedDuringTestBefore = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)
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
          expect({
            ...response.body.device,
            configurationData: JSON.parse(response.body.device.configurationData),
          }).to.containSubset({
            name: deviceName,
            deviceTypeId: geneXpertDeviceType.id,
            serial: secondDeviceSerial,
            configurationData: {
              gxAlertDeviceId: secondGxAlertDeviceId,
              deviceSerialNumber: secondDeviceSerial,
            },
          })

          const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)

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
          expect(devicesCreatedDuringTestAfter).to.have.length(devicesCreatedDuringTestBefore.length + 1)
        })
      })

      describe('but gxAlertDeviceId remains the same', () => {
        it('should update the serial numbers of the existing device', async () => {
          const gxAlertDeviceType = await getDeviceType('GxAlert', knex)
          const geneXpertDeviceType = await getDeviceType('CepheidGeneXpert', knex)
          const devicesCreatedDuringTestBefore = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)
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
          expect({
            ...response.body.device,
            configurationData: JSON.parse(response.body.device.configurationData),
          }).to.containSubset({
            name: deviceName,
            deviceTypeId: geneXpertDeviceType.id,
            serial: thirdDeviceSerial,
            configurationData: {
              deviceSerialNumber: thirdDeviceSerial,
            },
          })

          const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)

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
              serial: thirdDeviceSerial,
              configurationData: {
                deviceSerialNumber: thirdDeviceSerial,
                gxAlertDeviceId: firstGxAlertDeviceId,
              },
            },
          ])
          expect(devicesCreatedDuringTestAfter).to.have.length(devicesCreatedDuringTestBefore.length)
        })
      })

      describe("and collides with another device's serial number", () => {
        it('should update the serial numbers of the device, creating a duplicate set of serial numbers', async () => {
          const gxAlertDeviceType = await getDeviceType('GxAlert', knex)
          const geneXpertDeviceType = await getDeviceType('CepheidGeneXpert', knex)
          const devicesCreatedDuringTestBefore = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)
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
          ])
          expect(devicesCreatedDuringTestBefore).to.have.length(2)

          useGxAlertDeviceId(secondGxAlertDeviceId)
          const { deviceAuth, basicDevicePayload } = context
          const responseForSecondDevice = await postToDeviceApi({
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
          expect({
            ...responseForSecondDevice.body.device,
            configurationData: JSON.parse(responseForSecondDevice.body.device.configurationData),
          }).to.containSubset({
            name: deviceName,
            deviceTypeId: geneXpertDeviceType.id,
            serial: secondDeviceSerial,
            configurationData: {
              gxAlertDeviceId: secondGxAlertDeviceId,
              deviceSerialNumber: secondDeviceSerial,
            },
          })

          const devicesCreatedDuringTestAfterSecondDeviceSerial = await getDevicesWithIdLargerThan(
            maxDeviceIdBefore,
            knex
          )

          expect(devicesCreatedDuringTestAfterSecondDeviceSerial).to.have.length(
            devicesCreatedDuringTestBefore.length + 1
          )
          expect(devicesCreatedDuringTestAfterSecondDeviceSerial).to.containSubset([
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

          const responseAfterSecondDeviceUpdate = await postToDeviceApi({
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
          expect({
            ...responseAfterSecondDeviceUpdate.body.device,
            configurationData: JSON.parse(responseAfterSecondDeviceUpdate.body.device.configurationData),
          }).to.containSubset({
            name: deviceName,
            deviceTypeId: geneXpertDeviceType.id,
            serial: firstDeviceSerial,
            configurationData: {
              gxAlertDeviceId: secondGxAlertDeviceId,
              deviceSerialNumber: firstDeviceSerial,
            },
          })

          const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)
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
          expect(devicesCreatedDuringTestAfter).to.have.length(devicesCreatedDuringTestAfterSecondDeviceSerial.length)
        })
      })

      describe('to NULL', () => {
        it('should not update the serial to NULL', async () => {
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
          expect({
            ...response.body.device,
            configurationData: JSON.parse(response.body.device.configurationData),
          }).to.containSubset({
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
        })
      })
    })

    describe('when the hostId of the source device changes', () => {
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
        getCurrentGeneXpertDevice,
        afterCleanUp,
      } = context

      beforeEach(async () => {
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

      afterEach(afterCleanUp)

      describe('and gxAlertDeviceId changes', () => {
        it('should create a new device', async () => {
          const gxAlertDeviceType = await getDeviceType('GxAlert', knex)
          const geneXpertDeviceType = await getDeviceType('CepheidGeneXpert', knex)
          const devicesCreatedDuringTestBefore = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)
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
          expect({
            ...response.body.device,
            configurationData: JSON.parse(response.body.device.configurationData),
          }).to.containSubset({
            name: deviceName,
            deviceTypeId: geneXpertDeviceType.id,
            hostId: secondHostId,
            configurationData: {
              gxAlertDeviceId: secondGxAlertDeviceId,
              hostId: secondHostId,
            },
          })

          const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)
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
          expect(devicesCreatedDuringTestAfter).to.have.length(devicesCreatedDuringTestBefore.length + 1)
        })
      })

      describe('but gxAlertDeviceId remains the same', () => {
        it('should update the Host ID of the existing device', async () => {
          const gxAlertDeviceType = await getDeviceType('GxAlert', knex)
          const geneXpertDeviceType = await getDeviceType('CepheidGeneXpert', knex)
          const devicesCreatedDuringTestBefore = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)

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
          expect({
            ...response.body.device,
            configurationData: JSON.parse(response.body.device.configurationData),
          }).to.containSubset({
            name: deviceName,
            deviceTypeId: geneXpertDeviceType.id,
            hostId: thirdHostId,
            configurationData: {
              hostId: thirdHostId,
            },
          })

          const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)

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
              hostId: thirdHostId,
              configurationData: {
                hostId: thirdHostId,
                gxAlertDeviceId: firstGxAlertDeviceId,
              },
            },
          ])
          expect(devicesCreatedDuringTestAfter).to.have.length(devicesCreatedDuringTestBefore.length)
        })
      })

      describe("and collides with another device's Host ID", () => {
        it('should update the Host ID of the device, creating a duplicate Host ID', async () => {
          const gxAlertDeviceType = await getDeviceType('GxAlert', knex)
          const geneXpertDeviceType = await getDeviceType('CepheidGeneXpert', knex)
          const devicesCreatedDuringTestBefore = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)
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
          ])
          expect(devicesCreatedDuringTestBefore).to.have.length(2)

          useGxAlertDeviceId(secondGxAlertDeviceId)
          const { deviceAuth, basicDevicePayload } = context
          const responseForSecondDevice = await postToDeviceApi({
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
          expect({
            ...responseForSecondDevice.body.device,
            configurationData: JSON.parse(responseForSecondDevice.body.device.configurationData),
          }).to.containSubset({
            name: deviceName,
            deviceTypeId: geneXpertDeviceType.id,
            hostId: secondHostId,
            configurationData: {
              gxAlertDeviceId: secondGxAlertDeviceId,
              hostId: secondHostId,
            },
          })

          const devicesCreatedDuringTestAfterSecondHostId = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)
          expect(devicesCreatedDuringTestAfterSecondHostId).to.have.length(devicesCreatedDuringTestBefore.length + 1)
          expect(devicesCreatedDuringTestAfterSecondHostId).to.containSubset([
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

          const responseAfterSecondDeviceUpdate = await postToDeviceApi({
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
          expect({
            ...responseAfterSecondDeviceUpdate.body.device,
            configurationData: JSON.parse(responseAfterSecondDeviceUpdate.body.device.configurationData),
          }).to.containSubset({
            name: deviceName,
            deviceTypeId: geneXpertDeviceType.id,
            hostId: firstHostId,
            configurationData: {
              gxAlertDeviceId: secondGxAlertDeviceId,
              hostId: firstHostId,
            },
          })

          const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(maxDeviceIdBefore, knex)
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
          expect(devicesCreatedDuringTestAfter).to.have.length(devicesCreatedDuringTestAfterSecondHostId.length)
        })
      })

      describe('to NULL', () => {
        it('should not update the Host ID to NULL', async () => {
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
          expect({
            ...response.body.device,
            configurationData: JSON.parse(response.body.device.configurationData),
          }).to.containSubset({
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
          expect({
            ...nextResponse.body.device,
            configurationData: JSON.parse(nextResponse.body.device.configurationData),
          }).to.containSubset({
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
        })
      })
    })

    describe('when configuration data is sparser than a previous request', () => {
      const gxAlertDeviceId = 445
      const context = createContext()
      const { beforeCreateGxAlertApiKey, useGxAlertDeviceId, getCurrentGeneXpertDevice, afterCleanUp } = context

      before(async () => {
        await beforeCreateGxAlertApiKey()
        useGxAlertDeviceId(gxAlertDeviceId)
        const { deviceAuth } = context
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: {
            name: 'Xpert Lab',
            serial: 'DESKTOP-028CNRT',
            approval: null,
            type: { id: 'CepheidGeneXpert' },
            site: null,
            log: null,
            configuration: {
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

      after(afterCleanUp)

      it('should keep data from the prior request', async () => {
        const geneXpertDeviceAfterDailyDetails = await getCurrentGeneXpertDevice()
        const { deviceAuth } = context
        const response = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: {
            name: 'Xpert Lab',
            serial: 'DESKTOP-028CNRT',
            approval: null,
            type: { id: 'CepheidGeneXpert' },
            site: null,
            log: null,
            configuration: {
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

        assert.deepEqual(JSON.parse(response.body.device.configurationData), geneXpertDeviceAfterPing.configurationData)

        assert.deepEqual(geneXpertDeviceAfterPing.configurationData, geneXpertDeviceAfterDailyDetails.configurationData)
      })
    })

    describe('when maintenance data is included in device configuration data', () => {
      const context = createContext()
      const deviceName = 'Xpert Lab With Maintenance'
      const deviceSerial = 'Cepheid-1874GX'
      const hostId = 'MaintenanceXpertLab'
      const country = 'MM'
      const partner = 'Myanmar'
      const gxAlertDeviceId = 1777

      const { beforeCreateGxAlertApiKey, useGxAlertDeviceId, getCurrentGeneXpertDevice, afterCleanUp } = context

      let deviceId
      let standardDevicePayload

      async function getLatestDeviceMaintenanceStatusLog(knex) {
        await waitForIdle()
        const logEntry = await knex('Issue as i')
          .join('IssueType as it', 'it.id', 'i.issueTypeId')
          .join('IssueStatus as is', 'is.id', 'i.issueStatusId')
          .where({
            'i.deviceId': deviceId,
            'it.externalId': 'DeviceMaintenance',
          })
          .orderByRaw('i.updatedOn DESC, i.id DESC')
          .first('i.data', 'i.id', 'i.createdOn', 'is.externalId as status')
        if (_.isEmpty(logEntry)) {
          return logEntry
        }
        return _.merge(logEntry, { data: JSON.parse(logEntry.data) })
      }

      beforeEach(async () => {
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
            approval: null,
            type: { id: 'CepheidGeneXpert' },
            site: null,
            log: null,
            configuration: {
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

      afterEach(afterCleanUp)

      describe('which has been updated since the device configuration was last updated', () => {
        it('should create an entry in the device maintenance status log', async () => {
          const now = new Date()

          const deviceMaintenanceLogBeforeMaintenanceUpdate = await getLatestDeviceMaintenanceStatusLog(knex)
          assert.isUndefined(deviceMaintenanceLogBeforeMaintenanceUpdate)

          const waitForDeviceSeen = waitForAction(deviceSeen(deviceId))
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
          await waitForDeviceSeen
          assert.isUndefined(deviceMaintenanceLogBeforeMaintenanceUpdate)

          const inactiveMaintenanceReason = 'Connectivity issues, router cannot connect'
          const inactiveMaintenanceNote = 'Router only has one SIM in it'
          const inactiveMaintenanceExpectedBackOnline = dateFormat(addDays(now, 15), 'yyyy-MM-dd')
          const waitForDeviceMaintenance = waitForAction(deviceMaintenance(deviceId))
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
          await waitForDeviceMaintenance
          const deviceMaintenanceLogAfterSecondMaintenanceUpdate = await getLatestDeviceMaintenanceStatusLog(knex)
          expect(deviceMaintenanceLogAfterSecondMaintenanceUpdate).to.containSubset({
            status: 'Active',
            data: {
              reason: inactiveMaintenanceReason,
              note: inactiveMaintenanceNote,
              expectedBackOnline: inactiveMaintenanceExpectedBackOnline,
            },
          })
        })

        describe('which includes {... inactive: false... }', () => {
          it('should clear the values in maintenance status log data', async () => {
            const now = new Date()

            const inactiveMaintenanceReason = 'Connectivity Problems'
            const inactiveMaintenanceNote = 'Router cannot connect to VPN'
            const inactiveMaintenanceExpectedBackOnline = dateFormat(addDays(now, 23), 'yyyy-MM-dd')
            const waitForDeviceMaintenance = waitForAction(deviceMaintenance(deviceId))
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
            await waitForDeviceMaintenance
            const deviceMaintenanceLogAfterInactiveMaintenanceUpdate = await getLatestDeviceMaintenanceStatusLog(knex)
            expect(deviceMaintenanceLogAfterInactiveMaintenanceUpdate).to.containSubset({
              status: 'Active',
              data: {
                reason: inactiveMaintenanceReason,
                note: inactiveMaintenanceNote,
                expectedBackOnline: inactiveMaintenanceExpectedBackOnline,
              },
            })

            await waitForApproximately(100, 'milliseconds')

            const activeMaintenanceReason = 'Connectivity Resolved'
            const activeMaintenanceNote = 'VPN config was incorrect'
            const activeMaintenanceExpectedBackOnline = dateFormat(now, 'yyyy-MM-dd')
            const waitForDeviceSeen = waitForAction(deviceSeen(deviceId))
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
            await waitForDeviceSeen
            const deviceMaintenanceLogAfterActiveMaintenanceUpdate = await getLatestDeviceMaintenanceStatusLog(knex)
            expect(deviceMaintenanceLogAfterActiveMaintenanceUpdate).to.containSubset({
              status: 'Resolved',
            })
          })

          it('should update the last seen on time for the device', async () => {
            const now = new Date()

            // First mark as inactive
            await waitForApproximately(100, 'milliseconds')
            const inactiveMaintenanceReason = 'No Connection'
            const inactiveMaintenanceNote = 'Router cannot connect to the network'
            const inactiveMaintenanceExpectedBackOnline = dateFormat(addDays(now, 16), 'yyyy-MM-dd')
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

            const { lastSeenOn: lastSeenOnAfterInactive } = await knex('Device')
              .where({ id: deviceId })
              .first('lastSeenOn')

            // Then mark as active
            await waitForApproximately(1, 'second')

            const activeMaintenanceReason = 'Connectivity Resolved'
            const activeMaintenanceNote = 'VPN config was incorrect'
            const activeMaintenanceExpectedBackOnline = dateFormat(now, 'yyyy-MM-dd')
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
            const { lastSeenOn: lastSeenOnAfterActive } = await knex('Device')
              .where({ id: deviceId })
              .first('lastSeenOn')
            expect(lastSeenOnAfterActive).to.be.above(lastSeenOnAfterInactive)
          })
        })

        describe('which includes {... inactive: true... }', () => {
          it('should eventually set device flag: maintenance to true', async () => {
            const now = new Date()
            const { id: deviceId } = await getCurrentGeneXpertDevice()

            const waitForFactGenerateDeviceConnectivity = waitForAction(factGenerateDeviceConnectivity(deviceId))
            await waitForFactGenerateDeviceConnectivity

            await knex('FactDeviceFlag').where({ deviceId }).update({ maintenance: 0, maintenanceDueOn: null })
            let deviceFacts = await knex('FactDeviceFlag').where({ deviceId }).first()
            assert.notOk(deviceFacts.maintenance)

            const waitForMaintenance = waitForAction(deviceMaintenance(deviceId))

            const inactiveMaintenanceReason = 'Connectivity Problems'
            const inactiveMaintenanceNote = 'Router cannot connect to VPN'
            const inactiveMaintenanceExpectedBackOnline = dateFormat(addDays(now, 23), 'yyyy-MM-dd')
            const response = await postToDeviceApi(
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
            assert.equal(response.body.device.id, deviceId)

            await waitForMaintenance
            await waitForIdle()

            deviceFacts = await knex('FactDeviceFlag').where({ deviceId }).first()
            assert.ok(deviceFacts.maintenance)
          })
        })
      })

      describe('which is just a duplicate of what was sent previously', () => {
        it('should NOT create an entry in the device maintenance status log', async () => {
          const now = new Date()

          const inactiveMaintenanceReason = 'Duplicate No ping'
          const inactiveMaintenanceNote = 'Duplicate Router shows connected'
          const inactiveMaintenanceExpectedBackOnline = dateFormat(addDays(now, 19), 'yyyy-MM-dd')
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

          const deviceMaintenanceLogAfterInactiveUpdate = await getLatestDeviceMaintenanceStatusLog(knex)
          expect(deviceMaintenanceLogAfterInactiveUpdate).to.containSubset({
            status: 'Active',
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

          const deviceMaintenanceLogAfterSecondInactiveUpdate = await getLatestDeviceMaintenanceStatusLog(knex)
          assert.deepEqual(deviceMaintenanceLogAfterSecondInactiveUpdate, deviceMaintenanceLogAfterInactiveUpdate)
        })
      })

      describe(`maintenance data effect on device maintenance status`, () => {
        it('should change the maintenance status of an active device to inactive', async () => {
          useGxAlertDeviceId(gxAlertDeviceId)
          await postToDeviceApi(standardDevicePayload)
          let geneXpertDevice = await getCurrentGeneXpertDevice()
          const deviceMaintenanceStatuses = await allDeviceMaintenanceStatusToId()
          const [deviceMaintenanceStatusLogId] = await knex('DeviceMaintenanceStatusLog').insert({
            deviceId: geneXpertDevice.id,
            deviceMaintenanceStatusId: deviceMaintenanceStatuses.reportedActive,
            day: startOfToday(),
            data: '{}',
            createdOn: new Date(),
          })
          await knex('Device').where('id', geneXpertDevice.id).update({
            deviceMaintenanceStatusLogId,
          })
          await postToDeviceApi(
            _.merge(standardDevicePayload, {
              payload: {
                configuration: {
                  data: {
                    inactive: true,
                    inactiveMaintenanceReason: 'stock',
                    inactiveMaintenanceNote: 'More cartridges coming next week',
                  },
                },
              },
            })
          )
          await waitForAction({
            type: types.DEVICE_MAINTENANCE_STATUS_LOGGED,
          })
          await waitForIdle()
          geneXpertDevice = await getCurrentGeneXpertDevice()
          assert.equal(geneXpertDevice.deviceMaintenanceStatus, 'inactiveOutOfInventory')
          const latestMaintenanceStatusLog = await knex('DeviceMaintenanceStatusLog')
            .where('deviceId', geneXpertDevice.id)
            .orderByRaw('createdOn desc, id desc')
            .orderBy(['createdOn', 'id'], 'desc')
            .first()
          expect(latestMaintenanceStatusLog).to.containSubset({
            day: getLocalDateInUtc(startOfToday()),
            deviceMaintenanceStatusId: deviceMaintenanceStatuses.inactiveOutOfInventory,
          })
        })
      })
    })

    describe('when lastPingOn is included in the configuration data payload', () => {
      const deviceName = 'GeneXpert Lab With Last Ping Time'
      const deviceIdFromGxAlert = 12
      const macAddress = 'MAC0012LASTPING'

      const context = createContext()
      const now = new Date()
      const { beforeCreateGxAlertApiKey, useGxAlertDeviceId, getCurrentGeneXpertDevice, afterCleanUp } = context
      let { deviceAuth, basicDevicePayload } = context

      before(async () => {
        await beforeCreateGxAlertApiKey()
        useGxAlertDeviceId(deviceIdFromGxAlert)
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

      after(afterCleanUp)

      it('should explicitly set the lastSeenOn and lastPingOn dates on the device', async () => {
        const { deviceAuth, basicDevicePayload } = context
        const lastPingOn = setMilliseconds(
          subMinutes(subHours(now, Math.floor(Math.random() * 24)), Math.floor(Math.random() * 60)),
          0
        )
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            configuration: {
              data: {
                lastPingOn,
              },
            },
          }),
        })
        const sourceDevice = await getCurrentGeneXpertDevice()
        expect(sourceDevice.lastSeenOn.getTime()).to.equal(lastPingOn.getTime())
        expect(sourceDevice.lastPingOn.getTime()).to.equal(lastPingOn.getTime())
      })
    })

    describe('when location data included in device configuration data', () => {
      const context = createContext()
      const deviceName = 'Xpert Lab Location'
      const deviceSerial = 'Cepheid-19921GX'
      const hostId = 'StateLGAXpertLab'
      const country = 'MM'
      const partner = 'Myanmar'
      const gxAlertDeviceId = 19921

      const {
        beforeCreateGxAlertApiKey,
        useGxAlertDeviceId,

        getCurrentGeneXpertDevice,
        afterCleanUp,
      } = context

      let standardDevicePayload

      beforeEach(async () => {
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
            approval: null,
            type: { id: 'CepheidGeneXpert' },
            site: null,
            log: null,
            configuration: {
              data: {
                macAddress: 'MAC0A0127019921',
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
        await postToDeviceApi(standardDevicePayload)
        await waitForIdle()
      })

      afterEach(afterCleanUp)

      describe('and state as well as LGA belong to the country that the device is in', () => {
        it('should update the device and site to the location that was specified', async () => {
          const { countryGeographyId } = await knex('Geography as g')
            .join('Country as c', 'g.countryId', 'c.id')
            .where('c.abbreviation', country)
            .andWhere(function () {
              this.whereNull('g.stateId')
            })
            .andWhere(function () {
              this.whereNull('g.lgaId')
            })
            .first('g.id as countryGeographyId')

          const deviceBeforeUpdate = await getCurrentGeneXpertDevice()

          assert.equal(deviceBeforeUpdate.geographyId, countryGeographyId)

          const { newGeographyId, stateName, lgaName } = await knex('Geography as g')
            .join('Country as c', 'g.countryId', 'c.id')
            .join('State as s', 'g.stateId', 's.id')
            .join('Lga as l', 'g.lgaId', 'l.id')
            .where('c.abbreviation', country)
            .orderBy('g.id', 'desc')
            .first('g.id as newGeographyId', 's.name as stateName', 'l.name as lgaName')

          await postToDeviceApi(
            _.merge(standardDevicePayload, {
              payload: {
                configuration: {
                  data: {
                    state: stateName,
                    lga: lgaName,
                  },
                },
              },
            })
          )

          const deviceAfterUpdate = await getCurrentGeneXpertDevice()
          expect(deviceAfterUpdate).to.containSubset({
            id: deviceBeforeUpdate.id,
            siteId: deviceBeforeUpdate.siteId,
            geographyId: newGeographyId,
          })

          const siteAfterUpdate = await knex('Site').where('id', deviceAfterUpdate.siteId).first()
          assert.equal(siteAfterUpdate.geographyId, newGeographyId)
        })
      })

      describe('and only state belongs to the country that the device is in', () => {
        it('should update the device and site to the state that was specified, setting LGA to NULL', async () => {
          const { stateGeographyId, stateId, stateName } = await knex('Geography as g')
            .join('Country as c', 'g.countryId', 'c.id')
            .join('State as s', 'g.stateId', 's.id')
            .where('c.abbreviation', country)
            .andWhere(function () {
              this.whereNull('g.lgaId')
            })
            .first('g.id as stateGeographyId', 'g.stateId', 's.name as stateName')

          const deviceBeforeUpdate = await getCurrentGeneXpertDevice()

          assert.notEqual(deviceBeforeUpdate.geographyId, stateGeographyId)

          await postToDeviceApi(
            _.merge(standardDevicePayload, {
              payload: {
                configuration: {
                  data: {
                    state: stateName,
                    lga: 'Some random LGA',
                  },
                },
              },
            })
          )

          const deviceAfterUpdate = await getCurrentGeneXpertDevice()
          expect(deviceAfterUpdate).to.containSubset({
            id: deviceBeforeUpdate.id,
            siteId: deviceBeforeUpdate.siteId,
            geographyId: stateGeographyId,
          })

          const siteAfterUpdate = await knex('Site').where('id', deviceAfterUpdate.siteId).first()
          assert.equal(siteAfterUpdate.geographyId, stateGeographyId)

          const { secondStateGeographyId, secondStateId, secondStateName } = await knex('Geography as g')
            .join('Country as c', 'g.countryId', 'c.id')
            .join('State as s', 'g.stateId', 's.id')
            .where('c.abbreviation', country)
            .andWhere('g.stateId', '<>', stateId)
            .andWhere(function () {
              this.whereNull('g.lgaId')
            })
            .first('g.id as secondStateGeographyId', 'g.stateId as secondStateId', 's.name as secondStateName')

          assert.notEqual(secondStateName, stateName)

          const { invalidLgaInCountryGeographyId, invalidLgaName } = await knex('Geography as g')
            .join('Country as c', 'g.countryId', 'c.id')
            .join('State as s', 'g.stateId', 's.id')
            .join('Lga as l', 'g.lgaId', 'l.id')
            .where('c.abbreviation', country)
            .andWhere('g.stateId', '<>', secondStateId)
            .first('g.id as invalidLgaInCountryGeographyId', 'l.name as lgaName')

          assert.notEqual(invalidLgaInCountryGeographyId, secondStateGeographyId)

          await postToDeviceApi(
            _.merge(standardDevicePayload, {
              payload: {
                configuration: {
                  data: {
                    state: secondStateName,
                    lga: invalidLgaName,
                  },
                },
              },
            })
          )

          const deviceAfterSecondUpdate = await getCurrentGeneXpertDevice()
          expect(deviceAfterSecondUpdate).to.containSubset({
            id: deviceAfterUpdate.id,
            siteId: deviceAfterUpdate.siteId,
            geographyId: secondStateGeographyId,
          })

          const siteAfterSecondUpdate = await knex('Site').where('id', deviceAfterSecondUpdate.siteId).first()
          assert.equal(siteAfterSecondUpdate.geographyId, secondStateGeographyId)
        })
      })

      describe('but only includes lga', () => {
        it('should not update the location information of the device or site', async () => {
          const deviceBeforeUpdate = await getCurrentGeneXpertDevice()

          const { lgaGeographyId, lgaName } = await knex('Geography as g')
            .join('Country as c', 'g.countryId', 'c.id')
            .join('Lga as l', 'g.lgaId', 'l.id')
            .where('c.abbreviation', country)
            .andWhere('g.id', '<>', deviceBeforeUpdate.geographyId)
            .first('g.id as lgaGeographyId', 'g.lgaId', 'l.name as lgaName')

          assert.notEqual(deviceBeforeUpdate.geographyId, lgaGeographyId)

          await postToDeviceApi(
            _.merge(standardDevicePayload, {
              payload: {
                configuration: {
                  data: {
                    lga: lgaName,
                  },
                },
              },
            })
          )

          const deviceAfterUpdate = await getCurrentGeneXpertDevice()
          expect(deviceAfterUpdate).to.containSubset({
            id: deviceBeforeUpdate.id,
            siteId: deviceBeforeUpdate.siteId,
            geographyId: deviceBeforeUpdate.geographyId,
          })

          const siteAfterUpdate = await knex('Site').where('id', deviceAfterUpdate.siteId).first()
          assert.equal(siteAfterUpdate.geographyId, deviceBeforeUpdate.geographyId)

          await postToDeviceApi(
            _.merge(standardDevicePayload, {
              payload: {
                configuration: {
                  data: {
                    state: null,
                    lga: lgaName,
                  },
                },
              },
            })
          )

          const deviceAfterSecondUpdate = await getCurrentGeneXpertDevice()
          expect(deviceAfterSecondUpdate).to.containSubset({
            id: deviceBeforeUpdate.id,
            siteId: deviceBeforeUpdate.siteId,
            geographyId: deviceBeforeUpdate.geographyId,
          })

          const siteAfterSecondUpdate = await knex('Site').where('id', deviceAfterSecondUpdate.siteId).first()
          assert.equal(siteAfterSecondUpdate.geographyId, deviceBeforeUpdate.geographyId)
        })
      })

      describe('and GPS coordinates are present in the payload', () => {
        it("should update the site's GPS coordinates", async () => {
          const deviceBeforeUpdate = await getCurrentGeneXpertDevice()
          const siteBeforeUpdate = await knex('Site').where('id', deviceBeforeUpdate.siteId).first()

          assert.isNull(siteBeforeUpdate.latitude)
          assert.isNull(siteBeforeUpdate.longitude)

          const latitude = 96.269997
          const longitude = 17.150999

          await postToDeviceApi(
            _.merge(standardDevicePayload, {
              payload: {
                configuration: {
                  data: {
                    state: null,
                    latitude,
                    longitude,
                  },
                },
              },
            })
          )

          const siteAfterUpdate = await knex('Site').where('id', deviceBeforeUpdate.siteId).first()

          expect(siteAfterUpdate).to.containSubset({
            latitude,
            longitude,
          })

          await postToDeviceApi(_.merge(standardDevicePayload))

          const siteAfterSecondUpdate = await knex('Site').where('id', deviceBeforeUpdate.siteId).first()

          expect(siteAfterSecondUpdate).to.containSubset({
            latitude,
            longitude,
          })

          await postToDeviceApi(
            _.merge(standardDevicePayload, {
              payload: {
                configuration: {
                  data: {
                    latitude: null,
                    longitude: null,
                  },
                },
              },
            })
          )

          const siteAfterThirdUpdate = await knex('Site').where('id', deviceBeforeUpdate.siteId).first()
          assert.isNull(siteAfterThirdUpdate.latitude)
          assert.isNull(siteAfterThirdUpdate.longitude)
        })
      })
    })
  })
})
