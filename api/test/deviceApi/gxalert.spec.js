const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const subDays = require('date-fns/sub_days')
const setMilliseconds = require('date-fns/set_milliseconds')
const { createGxAlertTestContext } = require('./gxalert_utils')
const { run } = require('../../src/db')

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

  // TODO: When new GxAlert device ID is sent for a device with a MAC address that already exists
  //     Do we update the existing device?
  //         Do we overwrite the GxAlert device ID?
  // TODO: When new GxAlert device ID is sent for a device with a Host ID that already exists
  // TODO: When new GxAlert device ID is sent for a device with a Device Name that already exists
  // TODO: Repeated different scanerios and assert that GxAlert device ID is unique every time

  describe('results', () => {
    const gxAlertDeviceId = 23847
    const deviceName = 'This Lab Has Results!'
    const basicResultPayload = {
      result: {
        id: 'UNIQUE-RESULT-ID',
        assay: {
          id: 'GxMtbRifUltra',
          version: '2',
        },
        instrument: {
          serial: '123456',
          module: {
            serial: '654321',
            name: 'A1',
          },
        },
        sender: {
          version: '4.7b',
          operator: 'Ashley Smashley',
        },
        patient: {
          id: '0833223622',
          name: 'Peta J',
          surname: 'McAllister',
          address: '22 Marble Road, Greenstone Hill',
          age: 25,
          gender: 'Female',
          phone: '0833243682',
        },
        sample: { id: 'PJM0833243682' },
        data: {
          probeData: {},
          customFieldData: {
            '1': {
              notAvailable: false,
              label: 'HIV Status',
              value: 'Unknown',
            },
            '2': {
              notAvailable: false,
              label: 'Visual Analysis',
              value: 'Blood Stained',
            },
          },
        },
      },
    }

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
    before(async () =>
      run(async () => {
        await beforeCreateGxAlertApiKey()
        useGxAlertDeviceId(gxAlertDeviceId)
      })
    )
    after(afterCleanUp)

    it('should reject a result without a start or end date date', () =>
      runTest(async () => {
        const { deviceAuth } = context

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
        const { deviceAuth } = context

        const beforeResultDetails = await getLastResult()

        assert.isUndefined(beforeResultDetails)

        const testStartedOn = setMilliseconds(subDays(context.now, 3), 0)

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

    // TODO: Should log the result under the GxAlert device

    it('should update a result if the external ID is known', () =>
      runTest(async () => {
        const { deviceAuth } = context

        const beforeResultDetails = await getLastResult()

        assert.isNotEmpty(beforeResultDetails)

        const testStartedOn = setMilliseconds(subDays(context.now, 3), 0)
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
        assert.equal(beforeResultDetails.id, afterResultDetails.id)
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
  })
})
