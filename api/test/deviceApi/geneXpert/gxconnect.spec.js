const _ = require('lodash')

const chai = require('chai')
const chaiSubset = require('chai-subset')
const addYears = require('date-fns/addYears')
const subDays = require('date-fns/subDays')
const addHours = require('date-fns/addHours')
const subHours = require('date-fns/subHours')
const addMinutes = require('date-fns/addMinutes')
const subMinutes = require('date-fns/subMinutes')
const setMilliseconds = require('date-fns/setMilliseconds')
const dateFormat = require('date-fns/format')
const Promise = require('bluebird')
const { createGxConnectTestContext } = require('./gxconnect_utils')
const { getLastResultId, postToDeviceApi } = require('../utils')
const { basicResultPayload } = require('./geneXpertConstants')
const {
  detectedLess1000,
  detectedMoreThan1000,
  noDetected,
  detectedWithNoCopies,
  invalidCategory,
  errorCategory,
  resultTextNull,
  badCategorizedResults,
  badCategorizedResults2,
} = require('./HIV_VL_payload')
const { run, knex: knexDb } = require('../../../src/db')
const { waitForApproximately } = require('../../utils/generatorFunctionUtils')
const { waitForIdle, waitForAction } = require('../../utils/mqUtils')
const { deviceSeen } = require('../../../src/device/actions')
const { resultCategoryToId, deviceTypeToId, assayToId } = require('../../../src/shared/dictionary')

const {
  gxEbola: gxEbolaMappings,
  gxHiv1Qual: gxHiv1QualMappings,
  gxMtbRif: gxMtbRifMappings,
  gxMtbRifUltra: gxMtbRifUltraMappings,
  gxMtbXdr: gxMtbXdrMappings,
  assayGxCovid19: assayGxCovid19Mappings,
} = require('./notVLResultTextMappings')
const { knex } = require('../../../src/db')

const server = require('../../utils/testUtils')
const { assayNameToExternalId } = require('../../../src/shared/assayNameToExternalId')

const { assert, expect } = chai.use(chaiSubset)

describe('Device API routes for GxConnect Devices', () => {
  const macAddress = 'MAC00000000FAKE'
  const adminUsername = 'admin'
  const adminPassword = 'test07'
  const countryCode = 'US'
  const deviceName = 'New GeneXpert Laboratory'
  const deviceSerialNumber = 'Cepheid-PC-BLH'
  const hostId = 'BLH-Expert'

  describe('registration and configuration', () => {
    describe('when no device API key is specified', () => {
      const context = createGxConnectTestContext(server, {
        macAddress,
        adminUsername,
        adminPassword,
      })

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

    describe('when an unknown device API key is specified', () => {
      const context = createGxConnectTestContext(server, {
        macAddress,
        adminUsername,
        adminPassword,
      })

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

    describe('when a known device API key is specified', () => {
      describe('send new device data', () => {
        describe('before a device name and country code have been specified', () => {
          const context = createGxConnectTestContext(server, {
            macAddress,
            adminUsername,
            adminPassword,
          })

          before(context.beforeRequestNewApiKey)
          const { runTest } = context
          after(context.afterCleanUp)

          it('should respond with NOT_FOUND', () =>
            runTest(async () => {
              const { deviceAuth, basicDevicePayload } = context
              await server
                .post('/device')
                .set('Authorization', deviceAuth)
                .send(basicDevicePayload)
                .then(res => {
                  assert.equal(res.statusCode, 404)
                })
                .catch(assert.fail)
            }))
        })

        describe('after a device name and country code have been specified', () => {
          const context = createGxConnectTestContext(server, {
            countryCode,
            adminUsername,
            adminPassword,
            deviceName,
            macAddress,
          })

          beforeEach(context.beforeRegisterAndSetDevice)
          const { runTest } = context
          afterEach(context.afterCleanUp)

          it('should respond with OK', () =>
            runTest(async () => {
              const { deviceAuth, basicDevicePayload } = context
              await server
                .post('/device')
                .set('Authorization', deviceAuth)
                .send(basicDevicePayload)
                .then(res => {
                  assert.equal(res.statusCode, 200)
                })
                .catch(assert.fail)
            }))

          it('should have created a device and linked it to the device API key', () =>
            runTest(async knex => {
              const { basicDevicePayload, apiKey } = context
              const deviceDetails = await knex('DeviceApiKey as dak')
                .join('Device as d', 'dak.DeviceId', 'd.id')
                .join('Site as s', 'd.siteId', 's.id')
                .join('Geography as g', 's.geographyId', 'g.id')
                .join('Country as c', 'g.countryId', 'c.id')
                .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
                .where({ 'dak.token': apiKey })
                .select(
                  'd.name as deviceName',
                  'd.macAddress',
                  's.name as siteName',
                  'c.abbreviation as countryCode',
                  'dt.externalId as deviceType'
                )
              assert.deepEqual(deviceDetails, [
                {
                  deviceName,
                  macAddress,
                  siteName: deviceName,
                  countryCode,
                  deviceType: basicDevicePayload.type.id,
                },
              ])
            }))

          it('should update timezone', async () => {
            const { basicDevicePayload, deviceAuth, device } = context

            assert.equal(device.timezone, 'Eastern Standard Time')
            const timezone = 'South Africa Standard Time'

            const devicePath = '/device'
            // add device
            let res = await server
              .post(devicePath)
              .set('Authorization', deviceAuth)
              .send({
                ...basicDevicePayload,
                configuration: { data: { timezone } },
              })

              .catch(assert.fail)

            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            let newDevice = await knexDb('Device as d').where('d.id', device.id).first('d.*')

            assert.isOk(newDevice)
            assert.equal(newDevice.timezone, 'South Africa Standard Time')

            // update device
            res = await server
              .post(devicePath)
              .set('Authorization', deviceAuth)
              .send({
                ...basicDevicePayload,
                configuration: {
                  data: {
                    timezone: 'not existing  Standard Time',
                  },
                },
              })

            newDevice = await knexDb('Device as d').where('d.id', device.id).first('d.*')
            assert.isOk(newDevice)
            assert.equal(newDevice.timezone, 'South Africa Standard Time')
            assert.equal(newDevice.serial, null)
          })
        })
      })
    })

    describe('generating a new device API key from a device with a known Host ID/device serial combination', () => {
      const firstContext = createGxConnectTestContext(server, {
        countryCode,
        adminUsername,
        adminPassword,
        deviceName,
        deviceSerialNumber,
        hostId,
      })

      before(firstContext.beforeRegisterAndSetDevice)
      after(firstContext.afterCleanUp)

      it('should not create a duplicate device', () =>
        firstContext.runTest(async knex => {
          // Check that device exists with MAC Address and Instrument Serial
          const firstDeviceUniqueIdentifiers = await knex('DeviceApiKey as dak')
            .join('Device as d', 'dak.DeviceId', 'd.id')
            .where({ 'dak.token': firstContext.apiKey })
            .select('d.hostId', 'd.serial')

          assert.deepEqual(firstDeviceUniqueIdentifiers, [
            {
              hostId,
              serial: deviceSerialNumber,
            },
          ])

          // Single device exists, now generate a new API key
          const secondContext = createGxConnectTestContext(server, {
            countryCode,
            adminUsername,
            adminPassword,
            deviceName,
            deviceSerialNumber,
            hostId,
          })

          await secondContext.registerAndSetDevice()

          await secondContext.runTestInline(async knex => {
            assert.notEqual(secondContext.apiKey, firstContext.apiKey)
            // Submit same device configuration with host ID and device serial numbers
            await server
              .post('/device')
              .set('Authorization', secondContext.deviceAuth)
              .send(
                _.merge({}, secondContext.basicDevicePayload, {
                  configuration: {
                    data: {
                      country: countryCode,
                      deviceSerialNumber,
                      hostId,
                    },
                  },
                })
              )

            const firstDeviceApiKeyStatus = await knex('DeviceApiKey as dak')
              .where({ 'dak.token': firstContext.apiKey })
              .select('dak.deviceId', 'dak.revoked')

            // Check that old API key is revoked
            assert.lengthOf(firstDeviceApiKeyStatus, 1)
            assert.isNumber(firstDeviceApiKeyStatus[0].deviceId)
            assert.equal(firstDeviceApiKeyStatus[0].revoked, 1)

            // Check that device exists with MAC Address and Instrument
            // Serial linked to the new device API key
            const secondDeviceUniqueIdentifiers = await knex('DeviceApiKey as dak')
              .join('Device as d', 'dak.DeviceId', 'd.id')
              .where({ 'dak.token': secondContext.apiKey })
              .select('d.hostId', 'd.serial', 'd.id')
            assert.deepEqual(secondDeviceUniqueIdentifiers, [
              {
                hostId,
                serial: deviceSerialNumber,
                id: secondContext.device.id,
              },
            ])
          })

          await secondContext.cleanUp()
        }))
    })

    describe('when the MAC address of the device changes', () => {
      describe('and device API key changes', () => {
        const firstContext = createGxConnectTestContext(server, {
          countryCode,
          adminUsername,
          adminPassword,
          deviceName,
          macAddress,
          deviceSerialNumber,
          hostId,
        })

        before(firstContext.beforeRegisterAndSetDevice)
        after(firstContext.afterCleanUp)

        it('should update the MAC address for the device and assign it with a new API key', () =>
          firstContext.runTest(async knex => {
            // Check that device exists with MAC Address and Instrument Serial
            const firstDeviceUniqueIdentifiers = await knex('DeviceApiKey as dak')
              .join('Device as d', 'dak.DeviceId', 'd.id')
              .where({ 'dak.token': firstContext.apiKey })
              .first('d.macAddress', 'dak.token')

            assert.equal(firstDeviceUniqueIdentifiers.macAddress, macAddress)

            // Single device exists, now generate a new API key
            const newMacAddress = 'MAC12345678FAKE'
            const secondContext = createGxConnectTestContext(server, {
              countryCode,
              adminUsername,
              adminPassword,
              deviceName,
              macAddress: newMacAddress,
              deviceSerialNumber,
              hostId,
            })

            await secondContext.registerAndSetDevice()

            await secondContext.runTestInline(async knex => {
              assert.notEqual(secondContext.apiKey, firstContext.apiKey)

              const firstDeviceApiKeyStatus = await knex('DeviceApiKey as dak')
                .where({ 'dak.token': firstDeviceUniqueIdentifiers.token })
                .select('dak.deviceId', 'dak.revoked')

              // Check that old API key is revoked
              assert.lengthOf(firstDeviceApiKeyStatus, 1)
              assert.isNumber(firstDeviceApiKeyStatus[0].deviceId)
              assert.equal(firstDeviceApiKeyStatus[0].revoked, 1)

              // Check that the device still exists with the new MAC Address
              // Serial linked to the new device API key
              const finalDeviceApiKeys = await knex('DeviceApiKey as dak')
                .join('Device as d', 'dak.DeviceId', 'd.id')
                .whereIn('dak.token', [firstContext.apiKey, secondContext.apiKey])
                .orderBy('dak.id', 'asc')
                .select('d.macAddress', 'd.id', 'dak.revoked')
              assert.deepEqual(finalDeviceApiKeys, [
                {
                  macAddress: newMacAddress,
                  id: firstContext.device.id,
                  revoked: 1,
                },
                {
                  macAddress: newMacAddress,
                  id: secondContext.device.id,
                  revoked: 0,
                },
              ])
            })

            await secondContext.cleanUp()
          }))
      })

      describe('but device API key remains the same', () => {
        const context = createGxConnectTestContext(server, {
          countryCode,
          adminUsername,
          adminPassword,
          deviceName,
          macAddress,
          hostId,
          deviceSerialNumber,
        })

        before(context.beforeRegisterAndSetDevice)
        const { runTest } = context
        after(context.afterCleanUp)

        it('should update the MAC address of the existing device', () =>
          runTest(async knex => {
            // Check that device exists with MAC Address and Instrument Serial
            const deviceUniqueIdentifiers = await knex('DeviceApiKey as dak')
              .join('Device as d', 'dak.DeviceId', 'd.id')
              .where({ 'dak.token': context.apiKey })
              .select('d.macAddress', 'd.hostId', 'd.serial')

            assert.deepEqual(deviceUniqueIdentifiers, [
              {
                macAddress,
                hostId,
                serial: deviceSerialNumber,
              },
            ])

            // Single device exists, now send a new MAC address
            const newMacAddress = 'MAC12345678FAKE'
            await server
              .post('/device')
              .set('Authorization', context.deviceAuth)
              .send(
                _.assign({}, context.basicDevicePayload, {
                  configuration: {
                    data: {
                      macAddress: newMacAddress,
                      deviceSerialNumber,
                      hostId,
                    },
                  },
                })
              )

            // Check that the MAC address has changed
            const newDeviceDetails = await knex('DeviceApiKey as dak')
              .join('Device as d', 'dak.DeviceId', 'd.id')
              .join('Site as s', 'd.siteId', 's.id')
              .join('Geography as g', 's.geographyId', 'g.id')
              .join('Country as c', 'g.countryId', 'c.id')
              .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
              .where({ 'dak.token': context.apiKey })
              .select(
                'd.id as deviceId',
                'd.name as deviceName',
                'd.macAddress',
                'd.serial',
                'd.hostId',
                's.name as siteName',
                'c.abbreviation as countryCode',
                'dt.externalId as deviceType'
              )

            assert.deepEqual(
              _.map(newDeviceDetails, device => _.omit(device, 'deviceId')),
              [
                {
                  deviceName,
                  macAddress: newMacAddress,
                  serial: deviceSerialNumber,
                  hostId,
                  siteName: deviceName,
                  countryCode,
                  deviceType: context.basicDevicePayload.type.id,
                },
              ]
            )

            // Check that there are no orphaned devices with
            // the old MAC address
            const orphanedDevices = await knex('Device').where({ macAddress }).select()

            assert.isEmpty(orphanedDevices)
          }))
      })
    })

    describe('when the device serial of the device changes', () => {
      const newDeviceSerialNumber = 'Cepheid-PC-123'
      describe('and device API key changes', () => {
        describe(', the MAC address changes and the host ID remains the name', () => {
          const firstContext = createGxConnectTestContext(server, {
            countryCode,
            adminUsername,
            adminPassword,
            deviceName,
            macAddress,
            hostId,
            deviceSerialNumber,
          })
          before(firstContext.beforeRegisterAndSetDevice)
          after(firstContext.afterCleanUp)
          const newMacAddress = 'MAC00000FAKE222'
          it('should update the device with the new MAC address and device serial', () =>
            firstContext.runTest(async knex => {
              // Check that device exists with MAC Address and Instrument Serial
              const firstDeviceUniqueIdentifiers = await knex('DeviceApiKey as dak')
                .join('Device as d', 'dak.DeviceId', 'd.id')
                .where({ 'dak.token': firstContext.apiKey })
                .first('dak.token', 'd.serial')
              assert.equal(firstDeviceUniqueIdentifiers.serial, deviceSerialNumber)

              // Single device exists, now generate a new API key
              const secondContext = createGxConnectTestContext(server, {
                countryCode,
                adminUsername,
                adminPassword,
                deviceName,
                macAddress: newMacAddress,
                hostId,
                deviceSerialNumber: newDeviceSerialNumber,
              })

              await secondContext.registerAndSetDevice()

              await secondContext.runTestInline(async knex => {
                assert.notEqual(secondContext.apiKey, firstContext.apiKey)

                const firstDeviceApiKeyStatus = await knex('DeviceApiKey as dak')
                  .where({ 'dak.token': firstDeviceUniqueIdentifiers.token })
                  .select('dak.deviceId', 'dak.revoked')

                // Check that old is still active
                assert.deepEqual(firstDeviceApiKeyStatus, [
                  {
                    deviceId: firstDeviceApiKeyStatus[0].deviceId,
                    revoked: 1,
                  },
                ])

                // Check that the device exists with the new Device
                // Serial linked to the new device API key
                const secondDeviceUniqueIdentifiers = await knex('DeviceApiKey as dak')
                  .join('Device as d', 'dak.DeviceId', 'd.id')
                  .where({ 'dak.token': secondContext.apiKey })
                  .select('d.macAddress', 'd.hostId', 'd.serial', 'd.id', 'dak.revoked')
                assert.deepEqual(secondDeviceUniqueIdentifiers, [
                  {
                    macAddress: newMacAddress,
                    hostId,
                    serial: newDeviceSerialNumber,
                    id: secondContext.device.id,
                    revoked: 0,
                  },
                ])
              })

              await secondContext.cleanUp()
            }))
        })

        describe(', the Host ID changes and the MAC address remains the name', () => {
          const firstContext = createGxConnectTestContext(server, {
            countryCode,
            adminUsername,
            adminPassword,
            deviceName,
            macAddress,
            hostId,
            deviceSerialNumber,
          })
          before(firstContext.beforeRegisterAndSetDevice)
          after(firstContext.afterCleanUp)
          const newHostId = 'NEW-Expert-3'
          it('should update the device with the new Host ID and device serial', () =>
            firstContext.runTest(async knex => {
              // Check that device exists with MAC Address and Instrument Serial
              const firstDeviceUniqueIdentifiers = await knex('DeviceApiKey as dak')
                .join('Device as d', 'dak.DeviceId', 'd.id')
                .where({ 'dak.token': firstContext.apiKey })
                .first('dak.token', 'd.serial')
              assert.equal(firstDeviceUniqueIdentifiers.serial, deviceSerialNumber)

              // Single device exists, now generate a new API key
              const secondContext = createGxConnectTestContext(server, {
                countryCode,
                adminUsername,
                adminPassword,
                deviceName,
                macAddress,
                hostId: newHostId,
                deviceSerialNumber: newDeviceSerialNumber,
              })

              await secondContext.registerAndSetDevice()

              await secondContext.runTestInline(async knex => {
                assert.notEqual(secondContext.apiKey, firstContext.apiKey)

                const firstDeviceApiKeyStatus = await knex('DeviceApiKey as dak')
                  .where({ 'dak.token': firstDeviceUniqueIdentifiers.token })
                  .select('dak.deviceId', 'dak.revoked')

                // Check that old is still active
                assert.deepEqual(firstDeviceApiKeyStatus, [
                  {
                    deviceId: firstDeviceApiKeyStatus[0].deviceId,
                    revoked: 1,
                  },
                ])

                // Check that the device exists with the new Device
                // Serial linked to the new device API key
                const secondDeviceUniqueIdentifiers = await knex('DeviceApiKey as dak')
                  .join('Device as d', 'dak.DeviceId', 'd.id')
                  .where({ 'dak.token': secondContext.apiKey })
                  .select('d.macAddress', 'd.hostId', 'd.serial', 'd.id', 'dak.revoked')
                assert.deepEqual(secondDeviceUniqueIdentifiers, [
                  {
                    macAddress,
                    hostId: newHostId,
                    serial: newDeviceSerialNumber,
                    id: secondContext.device.id,
                    revoked: 0,
                  },
                ])
              })

              await secondContext.cleanUp()
            }))
        })

        describe('and the host ID & MAC address are different', () => {
          const firstContext = createGxConnectTestContext(server, {
            countryCode,
            adminUsername,
            adminPassword,
            deviceName,
            macAddress,
            hostId,
            deviceSerialNumber,
          })
          before(firstContext.beforeRegisterAndSetDevice)
          after(firstContext.afterCleanUp)
          const newMacAddress = 'MAC00000FAKE444'
          const newHostId = 'NEW-Expert-4'

          it('should create a new device with the new serial and assign it with a new API key', () =>
            firstContext.runTest(async knex => {
              // Check that device exists with MAC Address and Instrument Serial
              const firstDeviceUniqueIdentifiers = await knex('DeviceApiKey as dak')
                .join('Device as d', 'dak.DeviceId', 'd.id')
                .where({ 'dak.token': firstContext.apiKey })
                .first('dak.token', 'd.serial')
              assert.equal(firstDeviceUniqueIdentifiers.serial, deviceSerialNumber)

              // Single device exists, now generate a new API key
              const secondContext = createGxConnectTestContext(server, {
                countryCode,
                adminUsername,
                adminPassword,
                deviceName,
                macAddress: newMacAddress,
                hostId: newHostId,
                deviceSerialNumber: newDeviceSerialNumber,
              })

              await secondContext.registerAndSetDevice()

              await secondContext.runTestInline(async knex => {
                assert.notEqual(secondContext.apiKey, firstContext.apiKey)

                const firstDeviceApiKeyStatus = await knex('DeviceApiKey as dak')
                  .where({ 'dak.token': firstDeviceUniqueIdentifiers.token })
                  .select('dak.deviceId', 'dak.revoked')

                // Check that old API key no longer associated with a device and is revoked
                assert.deepEqual(firstDeviceApiKeyStatus, [
                  {
                    deviceId: firstDeviceApiKeyStatus[0].deviceId,
                    revoked: 0,
                  },
                ])

                // Check that the device exists with the new Device
                // Serial linked to the new device API key
                const secondDeviceUniqueIdentifiers = await knex('DeviceApiKey as dak')
                  .join('Device as d', 'dak.DeviceId', 'd.id')
                  .where({ 'dak.token': secondContext.apiKey })
                  .select('d.macAddress', 'd.hostId', 'd.serial', 'd.id', 'dak.revoked')
                assert.deepEqual(secondDeviceUniqueIdentifiers, [
                  {
                    macAddress: newMacAddress,
                    hostId: newHostId,
                    serial: newDeviceSerialNumber,
                    id: secondContext.device.id,
                    revoked: 0,
                  },
                ])

                // Check that the devices are different (one API key per device
                assert.notEqual(secondDeviceUniqueIdentifiers[0].id, firstDeviceApiKeyStatus[0].deviceId)
              })

              await secondContext.cleanUp()
            }))
        })
      })

      describe('but device API key remains the same', () => {
        const context = createGxConnectTestContext(server, {
          countryCode,
          adminUsername,
          adminPassword,
          deviceName,
          macAddress,
          hostId,
          deviceSerialNumber,
        })

        before(context.beforeRegisterAndSetDevice)
        const { runTest } = context
        after(context.afterCleanUp)

        it('should update the serial of the existing device', () =>
          runTest(async knex => {
            // Check that device exists with MAC Address and Instrument Serial
            const deviceUniqueIdentifiers = await knex('DeviceApiKey as dak')
              .join('Device as d', 'dak.DeviceId', 'd.id')
              .where({ 'dak.token': context.apiKey })
              .select('d.macAddress', 'd.hostId', 'd.serial')

            assert.deepEqual(deviceUniqueIdentifiers, [
              {
                macAddress,
                hostId,
                serial: deviceSerialNumber,
              },
            ])

            // Single device exists, now send a 123456799 serial numbers
            const newDeviceSerialNumber = 'Cepheid-PC-098765'
            await server
              .post('/device')
              .set('Authorization', context.deviceAuth)
              .send(
                _.assign({}, context.basicDevicePayload, {
                  configuration: {
                    data: {
                      hostId,
                      deviceSerialNumber: newDeviceSerialNumber,
                    },
                  },
                })
              )

            // Check that the instrument serial has changed
            const newDeviceDetails = await knex('DeviceApiKey as dak')
              .join('Device as d', 'dak.DeviceId', 'd.id')
              .join('Site as s', 'd.siteId', 's.id')
              .join('Geography as g', 's.geographyId', 'g.id')
              .join('Country as c', 'g.countryId', 'c.id')
              .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
              .where({ 'dak.token': context.apiKey })
              .select(
                'd.id as deviceId',
                'd.name as deviceName',
                'd.macAddress',
                'd.hostId',
                'd.serial',
                's.name as siteName',
                'c.abbreviation as countryCode',
                'dt.externalId as deviceType'
              )

            assert.deepEqual(
              _.map(newDeviceDetails, device => _.omit(device, 'deviceId')),
              [
                {
                  deviceName,
                  macAddress,
                  hostId,
                  serial: newDeviceSerialNumber,
                  siteName: deviceName,
                  countryCode,
                  deviceType: context.basicDevicePayload.type.id,
                },
              ]
            )

            // Check that there are no orphaned devices with
            // the instrument serial numbers
            const orphanedDevices = await knex('Device').where({ serial: deviceSerialNumber }).select()

            assert.isEmpty(orphanedDevices)
          }))
      })
    })
  })

  describe('Device Daily details', () => {
    const macAddress = 'MAC00000321PING'

    const context = createGxConnectTestContext(server, {
      countryCode,
      adminUsername,
      adminPassword,
      deviceName,
      macAddress,
      deviceSerialNumber,
    })
    beforeEach(context.beforeRegisterAndSetDevice)
    afterEach(context.afterCleanUp)

    it('Download the custom fields', async () => {
      const { basicDevicePayload, deviceAuth } = context

      const res = await server
        .post('/device')
        .set('Authorization', deviceAuth)
        .send({ ...basicDevicePayload, getFormsDefinition: true, includeDeviceConfiguration: true })
        .catch(assert.fail)
      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'CustomFields')
      assert.typeOf(res.body.CustomFields, 'Object')
      assert.typeOf(res.body.CustomFields.Fields, 'Array')
      assert.isAtLeast(res.body.CustomFields.Fields.length, 1)
      const customFieldProperties = ['Label', 'Control', 'Type', 'DisplayOrder']
      _.each(customFieldProperties, fieldName => {
        assert.property(res.body.CustomFields.Fields[0], fieldName)
      })
    })
  })

  describe('ping', () => {
    const macAddress = 'MAC00000321PING'

    const context = createGxConnectTestContext(server, {
      countryCode,
      adminUsername,
      adminPassword,
      deviceName,
      macAddress,
      deviceSerialNumber,
    })
    beforeEach(context.beforeRegisterAndSetDevice)
    const { runTest } = context
    afterEach(context.afterCleanUp)

    it('should update the last seen and last ping time', () =>
      runTest(async knex => {
        const { basicDevicePayload, deviceAuth, device } = context
        const deviceBefore = await knex('Device').where('id', device.id).first()

        const waitForDeviceSeen = waitForAction(deviceSeen(deviceBefore.id))
        await waitForApproximately(1, 'second')
        await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(basicDevicePayload)
          .then(res => {
            assert.equal(res.status, 200)
          })
          .catch(assert.fail)

        await waitForDeviceSeen
        await waitForIdle()

        const deviceAfter = await knex('Device').where('id', device.id).first()
        deviceAfter.id.should.equal(deviceBefore.id)
        new Date(deviceAfter.lastSeenOn).should.be.above(deviceBefore.lastSeenOn)
        new Date(deviceAfter.lastPingOn).should.be.above(deviceBefore.lastPingOn)
      }))

    it('should eventually update the device fact offline status to false', () =>
      runTest(async knex => {
        const { basicDevicePayload, deviceAuth, device } = context
        await knex('FactDeviceFlag').where('deviceId', device.id).update({ offline: 1 })

        const deviceBefore = await knex('Device').where('id', device.id).first()

        const waitForDeviceSeen = waitForAction(deviceSeen(deviceBefore.id))
        await waitForApproximately(1, 'second')
        await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(basicDevicePayload)
          .then(res => {
            assert.equal(res.status, 200)
          })
          .catch(assert.fail)

        await waitForDeviceSeen
        await waitForIdle()

        const deviceAfter = await knex('Device as d')
          .join('FactDeviceFlag as fdf', 'd.id', 'fdf.deviceId')
          .where('d.id', device.id)
          .first()
        deviceAfter.id.should.equal(deviceBefore.id)
        assert.notOk(deviceAfter.offline)
      }))
  })

  describe('results', () => {
    const context = createGxConnectTestContext(server, {
      countryCode,
      adminUsername,
      adminPassword,
      deviceName,
      macAddress,
      deviceSerialNumber,
      instrumentSerial: '123456799',
    })
    beforeEach(context.beforeRegisterAndSetDevice)
    const { runTest, getLastResult, basicDevicePayload } = context
    afterEach(context.afterCleanUp)

    const getResultCategoriesTestCallback = trackedResults => async () => {
      const { deviceAuth, device } = context

      const assertion = _.sample(trackedResults)
      const { resultText, resultCategory1ExternalId, resultCategory2ExternalId, assayExternalId } = assertion
      // Send a new result
      await server
        .post('/device')
        .set('Authorization', deviceAuth)
        .send(
          _.merge({}, basicDevicePayload, { name: `${deviceName}${Math.random() * 1000}` }, basicResultPayload, {
            result: {
              id: `new result ${Math.floor(Math.random() * 1000)}`,
              startedOn: subDays(new Date(), Math.floor(Math.random() * 100)),
              data: {
                resultText,
                assay: Object.keys(assayNameToExternalId).find(
                  assayName => assayNameToExternalId[assayName] === assayExternalId
                ),
              },
              assay: { id: assayExternalId },
              sample: {
                id: `new sample ${Math.floor(Math.random() * 1000)}`,
              },
              instrument: {
                serial: `123456799 ${Math.floor(Math.random() * 1000)}`,
              },
            },
          })
        )
      await waitForIdle()
      const lastResultId = await getLastResultId(knex, device.id)
      const { resultCategory1, resultCategory2, assayId } = await knex('Result').where('id', lastResultId).first()

      const expectedResultCategory1Id = await resultCategoryToId(resultCategory1ExternalId)
      const expectedResultCategory2Id = (await resultCategoryToId(resultCategory2ExternalId)) || null
      const expectedAssayId = await assayToId(assayExternalId)
      const expected = {
        resultCategory1Id: expectedResultCategory1Id,
        resultCategory2Id: expectedResultCategory2Id,
        assayId: expectedAssayId,
      }
      const actual = {
        resultCategory1Id: resultCategory1,
        resultCategory2Id: resultCategory2,
        assayId,
      }
      assert.deepEqual(expected, actual)
    }

    it(
      'should append a new GxEbola result with the correct result categories',
      getResultCategoriesTestCallback(gxEbolaMappings)
    )
    it(
      'should append a new GxHiv1Qual result with the correct result categories',
      getResultCategoriesTestCallback(gxHiv1QualMappings)
    )
    it(
      'should append a new GxMtbRifUltra result with the correct result categories',
      getResultCategoriesTestCallback(gxMtbRifUltraMappings)
    )
    it(
      'should append a new GxMtbXdr result with the correct result categories',
      getResultCategoriesTestCallback(gxMtbXdrMappings)
    )
    it(
      'should append a new assayGxCovid19 result with the correct result categories',
      getResultCategoriesTestCallback(assayGxCovid19Mappings)
    )
    it(
      'should append a new GxMtbRif result with the correct result categories',
      getResultCategoriesTestCallback(gxMtbRifMappings)
    )

    it('should reject a result without a start or end date date', () =>
      runTest(async () => {
        const { basicDevicePayload, deviceAuth } = context

        const beforeResultDetails = await getLastResult()

        assert.isUndefined(beforeResultDetails)

        await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(_.assign({}, basicDevicePayload, basicResultPayload))
          .then(res => {
            assert.equal(res.status, 400)
          })
          .catch(assert.fail)

        const afterResultDetails = await getLastResult()
        assert.isUndefined(afterResultDetails)
      }))

    it('should append a result if the sample ID, instrument serial and test dates are not known', () =>
      runTest(async () => {
        const { basicDevicePayload, deviceAuth, device, site, now } = context

        const beforeResultDetails = await getLastResult()

        assert.isUndefined(beforeResultDetails)

        const testStartedOn = setMilliseconds(
          subMinutes(subHours(now, Math.floor(Math.random() * 24)), Math.floor(Math.random() * 60)),
          0
        )
        await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(
            _.assign({}, _.assign({}, basicDevicePayload, basicResultPayload), {
              result: _.assign({}, basicResultPayload.result, {
                sample: { id: 'new sample' },
                instrument: { serial: '123456799' },
                startedOn: testStartedOn,
              }),
            })
          )
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })
          .catch(assert.fail)

        const afterResultDetails = await getLastResult()

        expect(afterResultDetails).to.containSubset({
          deviceId: device.id,
          siteId: device.siteId,
          geographyId: site.geographyId,
          assay: basicResultPayload.result.assay.id,
          assayVersion: basicResultPayload.result.assay.version,
          resultSource: 'DiagnosticDevice',
          resultType: 'Patient',
          resultCategory1: 'Success',
          resultCategory2: null,
          sampleId: 'new sample',
          sampleCollectedOn: null,
          sampleOriginSiteId: device.siteId,
          sampleTypeId: null,
          resultData: _.assign({}, basicResultPayload.result.data, {
            geneXpertTestId: basicResultPayload.result.id,
          }),
          startedOn: testStartedOn,
          endedOn: null,
          consumableSerial: null,
          consumableExpirationDate: null,
          consumableLot: null,
          instrumentSerial: '123456799',
          moduleName: null,
          moduleSerial: null,
          patientData: {
            ...basicResultPayload.result.patient,
            phone: '+10833243682',
          },
          senderVersion: basicResultPayload.result.sender.version,
          senderOperator: basicResultPayload.result.sender.operator,
          notes: null,
          errorCode: null,
        })
      }))

    it('should append a result HIV VL and categorized it well', async () => {
      const { deviceAuth, basicDevicePayload, now } = context
      const payloads = [
        { payload: detectedWithNoCopies, expectedCategory: 'NoResult' },
        { payload: detectedMoreThan1000, expectedCategory: 'MoreThan1000' },
        { payload: detectedLess1000[0], expectedCategory: 'LessThan40' },
        { payload: detectedLess1000[1], expectedCategory: 'LessThan1000' },
        { payload: noDetected, expectedCategory: 'NotDetected' },
        { payload: invalidCategory, expectedCategory: 'Invalid' },
        { payload: errorCategory, expectedCategory: 'Error' },
        { payload: resultTextNull, expectedCategory: 'NoResult' },
        { payload: badCategorizedResults, expectedCategory: 'NotDetected' },
        { payload: badCategorizedResults2, expectedCategory: 'LessThan40' },
      ]
      await Promise.each(payloads, async elem => {
        const { result: resultPayload } = elem.payload

        const res = await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(
            _.assign({}, elem.payload, basicDevicePayload, {
              result: _.assign({}, elem.payload.result, {
                sample: {
                  id: `new sample ${Math.floor(Math.random() * 1000)}`,
                },
                instrument: {
                  serial: `123456799 ${Math.floor(Math.random() * 1000)}`,
                },
                startedOn: now,
              }),
            })
          )

        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')

        const afterResultDetails = await knex('Result as r')
          .join('Assay as a', 'r.assayId', 'a.id')
          .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
          .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
          .where('r.id', res.body.aspectResultId)
          .first(
            'r.*',
            'a.externalId as assayExternalId',
            'rc1.externalId as resultCategory1',
            'rc2.externalId as resultCategory2'
          )

        afterResultDetails.patientData = JSON.parse(afterResultDetails.patientData)
        afterResultDetails.resultData = JSON.parse(afterResultDetails.resultData)

        assert.equal(afterResultDetails.assayExternalId, resultPayload.assay.id)
        assert.equal(afterResultDetails.resultCategory1, elem.expectedCategory)
        assert.equal(afterResultDetails.resultCategory2, null)

        if (['MoreThan1000', 'LessThan1000'].includes(afterResultDetails.resultCategory1)) {
          assert.property(afterResultDetails.resultData, 'copies')
          assert.isAtLeast(afterResultDetails.resultData.copies, 40)
        } else if ('LessThan40'.indexOf(afterResultDetails.resultCategory1) === 0) {
          assert.notProperty(afterResultDetails.resultData, 'copies')
        }
      })
    })

    it('should update a result if the sample ID, instrument serial and test dates are known', () =>
      runTest(async () => {
        const { basicDevicePayload, deviceAuth, now } = context

        const testStartedOn = setMilliseconds(
          subMinutes(subHours(now, Math.floor(Math.random() * 24)), Math.floor(Math.random() * 60)),
          0
        )
        const sampleId = 'GxConnect test will be updated'
        const instrumentSerial = '123456799'

        // Send a new result
        await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(
            _.assign({}, _.assign({}, basicDevicePayload, basicResultPayload), {
              result: _.assign({}, basicResultPayload.result, {
                sample: { id: sampleId },
                instrument: { serial: instrumentSerial },
                startedOn: testStartedOn,
              }),
            })
          )
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })
          .catch(assert.fail)

        const beforeUpdateResultDetails = await getLastResult()

        await waitForApproximately(2, 'seconds')

        // Send new data about existing result
        const newResultData = {
          customFieldData: {
            1: {
              notAvailable: false,
              label: 'HIV Status',
              value: 'Positive',
            },
            2: {
              notAvailable: false,
              label: 'Visual Analysis',
              value: 'Blood Stained',
            },
          },
        }
        await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(
            _.assign({}, _.assign({}, basicDevicePayload, basicResultPayload), {
              result: _.assign({}, basicResultPayload.result, {
                sample: { id: sampleId },
                instrument: { serial: instrumentSerial },
                startedOn: testStartedOn,
                data: newResultData,
              }),
            })
          )
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })
          .catch(assert.fail)

        const afterUpdateResultDetails = await getLastResult()

        assert.equal(beforeUpdateResultDetails.id, afterUpdateResultDetails.id)
        assert.equal(beforeUpdateResultDetails.createdOn.toString(), afterUpdateResultDetails.createdOn.toString())
        expect(afterUpdateResultDetails.resultData).to.containSubset(newResultData)
        expect(afterUpdateResultDetails.updatedOn).to.be.above(beforeUpdateResultDetails.updatedOn)
      }))

    it('should merge results with same sample ID, start time, end time and instrument serial', () =>
      runTest(async knex => {
        const { deviceAuth, device, now } = context

        const resultIds = []
        const countResults = () =>
          knex('Result')
            .count('id as cnt')
            .then(([{ cnt }]) => cnt)
        const initialCount = await countResults()

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
            result: {
              id: dateFormat(new Date(), 'T'),
              startedOn: now,
              endedOn: now,
              instrument: { serial: '123456799' },
              sample: {
                id: "Bryan's Sputum",
              },
              data: { a: 'b', assay: 'HIV VL' },
              assay: { id: 'GxHiv1Vl' },
            },
          }),
          expectedStatusCode: 200,
        })
        let lastResultId = await getLastResultId(knex, device.id)
        resultIds.push(lastResultId)

        let result1 = await knex('Result as r').where({ id: resultIds[0] }).first()
        expect(JSON.parse(result1.resultData)).to.containSubset({ a: 'b' })
        assert.isNotOk(result1.errorCode)
        assert.equal(initialCount + 1, await countResults())

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
            result: {
              id: dateFormat(new Date(), 'T'),
              startedOn: now,
              endedOn: now,
              instrument: { serial: '123456799' },
              sample: {
                id: "Bryan's Sputum",
              },
              data: { a: 'b', c: 'd' },
              assay: { id: 'GxHiv1Vl' },
            },
          }),
          expectedStatusCode: 200,
        })
        lastResultId = await getLastResultId(knex, device.id)
        assert.equal(lastResultId, resultIds.slice(-1)[0])

        result1 = await knex('Result as r')
          .where({ id: resultIds.slice(-1)[0] })
          .first()
        expect(JSON.parse(result1.resultData)).to.containSubset({
          a: 'b',
          c: 'd',
        })
        assert.isNotOk(result1.errorCode)
        assert.equal(initialCount + 1, await countResults())

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
            result: {
              id: dateFormat(new Date(), 'T'),
              startedOn: subMinutes(now, 5),
              endedOn: now,
              instrument: { serial: '123456799' },
              sample: {
                id: "Bryan's Sputum 2",
              },
              data: { a: 'b' },
              assay: { id: 'GxHiv1Vl' },
            },
          }),
          expectedStatusCode: 200,
        })
        lastResultId = await getLastResultId(knex, device.id)
        assert.notEqual(lastResultId, resultIds[0])

        resultIds.push(lastResultId)

        let result2 = await knex('Result as r').where({ id: resultIds[1] }).first()
        assert.equal(initialCount + 2, await countResults())

        const result1SampleSite = await knex('Site as s').where({ id: result1.siteId }).first()

        const result2SampleSite = await knex('Site as s')
          .where('partnerId', result1SampleSite.partnerId)
          .where('id', '<>', result1.siteId)
          .first()

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
            result: {
              id: dateFormat(new Date(), 'T'),
              data: {
                a: 'b',
                c: 2,
                d: false,
                e: { f: 'g' },
                assay: 'Xpert MTB-RIF',
                resultText: '|MTB @label_result_detected||Rif Resistance @label_result_indeterminate',
              },
              type: { id: 'Study' },
              source: { id: 'EnteredByHand' },
              assay: {
                id: 'GxMtbRif',
                version: '1a.c1',
              },
              startedOn: subMinutes(now, 5),
              endedOn: now,
              sample: {
                id: "Bryan's Sputum 2",
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
                lot: '331',
              },
              instrument: {
                serial: '123456799',
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
          }),
          expectedStatusCode: 200,
        })
        lastResultId = await getLastResultId(knex, device.id)
        assert.equal(lastResultId, resultIds[1])

        result2 = await knex('Result as r').where({ id: resultIds[1] }).first()
        assert.equal(initialCount + 2, await countResults())
        expect(JSON.parse(result2.resultData)).to.containSubset({
          a: 'b',
          c: 2,
          d: false,
          e: { f: 'g' },
        })
        assert.equal(result2.assayVersion, '1a.c1')
        assert.equal(result2.consumableSerial, '132-44-222')
        assert.deepEqual(result2.consumableExpirationDate, new Date('2014-03-01'))
        assert.equal(result2.consumableLot, '331')
        assert.equal(result2.instrumentSerial, '123456799')
        assert.equal(result2.moduleName, 'ModA')
        assert.equal(result2.moduleSerial, '555-8')
        assert.equal(result2.researchId, 'R123')
        assert.deepEqual(JSON.parse(result2.patientData), {
          PatientName: 'Unknown',
          PatientSurname: 'Blood Stained',
          id: 'P-333',
          name: 'Bob',
          surname: 'Hope',
          gender: 'M',
          age: 72,
          dateOfBirth: '1903-05-29T00:00:00.000Z',
          address: '123 Main Street',
          phone: '+18567909',
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
        assert.equal(result2.notes, 'My Awesome notes about this Awesome result!')
        assert.equal(result2.errorCode, '123')
        assert.equal(result2.errorNotes, 'Oh NOZE!')

        const result2Type = await knex('ResultType as rt').where({ id: result2.resultTypeId }).first('externalId')
        assert.equal(result2Type.externalId, 'Study')

        const result2Source = await knex('ResultSource as rs').where({ id: result2.resultSourceId }).first('externalId')
        assert.equal(result2Source.externalId, 'EnteredByHand')

        const result2Assay = await knex('Assay as assay').where({ id: result2.assayId }).first('externalId', 'name')
        assert.equal(result2Assay.externalId, 'GxMtbRif')
        assert.equal(result2Assay.name, 'GeneXpert MTB/Rif')

        const result2Sample = await knex('Sample as s').where({ id: result2.sampleId }).first()

        assert.notEqual(
          result2.siteId,
          result2Sample.originSiteId,
          'Sample.originSiteId must be updated if the Sample is not mobile and the result is not transferred.'
        )
        assert.equal(result2Sample.externalId, "Bryan's Sputum 2")

        const [result2Category1, result2Category2] = await knex('ResultCategory as rt')
          .whereIn('id', [result2.resultCategory1, result2.resultCategory2])
          .select('externalId')
        assert.equal(result2Category1.externalId, 'Detected')
        assert.equal(result2Category2.externalId, 'Indeterminate')
      }))

    it('should update a result if the sample ID and startedOn date matches an existing result', () =>
      runTest(async knex => {
        const { deviceAuth, device, now } = context
        const testStartedOn = setMilliseconds(
          subMinutes(subHours(now, Math.floor(Math.random() * 24)), Math.floor(Math.random() * 60)),
          0
        )
        const sampleId = 'dupe'
        const instrumentSerial = 'Tested on the same instrument'

        // Send a new result
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
            result: {
              id: 'unique_id_1',
              sample: { id: sampleId },
              instrument: { serial: instrumentSerial },
              startedOn: testStartedOn,
            },
          }),
          expectedStatusCode: 200,
        })
        const firstResultId = await getLastResultId(knex, device.id)

        // Send another result with the same sample ID, but different start date
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
            result: {
              id: 'unique_id_2',
              sample: { id: sampleId },
              instrument: { serial: instrumentSerial },
              startedOn: testStartedOn,
            },
          }),
          expectedStatusCode: 200,
        })

        const secondResultId = await getLastResultId(knex, device.id)
        assert.equal(firstResultId, secondResultId)
      }))

    it('should update a result and set result category 2 correctly if it was previously set and is now null', () =>
      runTest(async knex => {
        const { deviceAuth, device, now } = context
        const testStartedOn = setMilliseconds(
          subMinutes(subHours(now, Math.floor(Math.random() * 24)), Math.floor(Math.random() * 60)),
          0
        )
        const sampleId = 'dupe'
        const instrumentSerial = 'Tested on the same instrument'

        // Send a new result
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
            result: {
              id: 'unique_id_1',
              sample: { id: sampleId },
              instrument: { serial: instrumentSerial },
              startedOn: testStartedOn,
              data: { resultText: 'NO RESULT' },
            },
          }),
          expectedStatusCode: 200,
        })
        const firstResultId = await getLastResultId(knex, device.id)

        // Send another result with the same sample ID, but different start date
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
            result: {
              id: 'unique_id_2',
              sample: { id: sampleId },
              instrument: { serial: instrumentSerial },
              startedOn: testStartedOn,
              data: { resultText: 'NOT DETECTED' },
            },
          }),
          expectedStatusCode: 200,
        })

        const secondResultId = await getLastResultId(knex, device.id)
        assert.equal(firstResultId, secondResultId)

        const [result] = await knex('Result').select('resultCategory1', 'resultCategory2').where('id', firstResultId)

        assert.equal(result.resultCategory1, await resultCategoryToId('NotDetected'))
        assert.equal(result.resultCategory2, null)
      }))

    it('should append (NOT update) a result if the sample ID matches an existing result, but the startedOn date does not', () =>
      runTest(async knex => {
        const { deviceAuth, device, now } = context
        const testStartedOn = setMilliseconds(
          subMinutes(subHours(now, Math.floor(Math.random() * 24)), Math.floor(Math.random() * 60)),
          0
        )
        const sampleId = 'dupe'
        const instrumentSerial = 'Tested on the same instrument'

        // Send a new result
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
            result: {
              id: 'unique_id_1',
              sample: { id: sampleId },
              instrument: { serial: instrumentSerial },
              startedOn: testStartedOn,
            },
          }),
          expectedStatusCode: 200,
        })
        const firstResultId = await getLastResultId(knex, device.id)

        // Send another result with the same sample ID, but different start date
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
            result: {
              id: 'unique_id_2',
              sample: { id: sampleId },
              instrument: { serial: instrumentSerial },
              startedOn: setMilliseconds(subMinutes(testStartedOn, 1234), 0),
            },
          }),
          expectedStatusCode: 200,
        })

        const secondResultId = await getLastResultId(knex, device.id)
        assert.notEqual(firstResultId, secondResultId)
      }))

    describe('when the assay in the result payload is HCV', () => {
      it('should be created with the right assay', () =>
        runTest(async () => {
          const { basicDevicePayload, deviceAuth } = context

          const testResultId = 'UNIQUE-ID-WITH-HCV-ASSAY-RESULT'

          const testStartedOn = setMilliseconds(subDays(context.now, 3), 0)
          const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, _.assign({}, basicDevicePayload, basicResultPayload), {
                result: _.assign({}, basicResultPayload.result, {
                  id: testResultId,
                  startedOn: testStartedOn,
                  endedOn: testEndedOn,
                  assay: {
                    id: 'GxHcvVl',
                    version: '1',
                  },
                  instrument: { serial: '123456799' },
                  data: {
                    assay: 'Xpert_HCV Viral Load',
                  },
                }),
              })
            )
            .then(res => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const lastResult = await getLastResult()
          assert.equal(lastResult.assay, 'GxHcv')
        }))
    })

    describe('when the assay in the result payload is unknown to Aspect', () => {
      const assayName = 'New Assay Type'
      after(() => run(async knex => knex('Assay').where({ externalId: assayName }).delete()))

      it('should set the result to assay GxUnknown', () =>
        runTest(async knex => {
          const { basicDevicePayload, deviceAuth, device } = context

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

          const testStartedOn = setMilliseconds(subDays(context.now, 3), 0)
          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, _.assign({}, basicDevicePayload, basicResultPayload), {
                result: _.assign({}, basicResultPayload.result, {
                  id: resultId,
                  startedOn: testStartedOn,
                  assay: {
                    id: assayName,
                    version: assayVersion,
                  },
                  instrument: { serial: '123456799' },
                  data: {
                    assay: 'New Assay Type',
                  },
                }),
              })
            )
            .then(res => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const resultDetails = await getLastResult(knex, device.id)
          assert.equal(resultDetails.resultData.geneXpertTestId, resultId)
          assert.equal(resultDetails.assay, 'GxUnknown')
        }))
    })

    describe('when the assay in the result payload is mapped to a consumable', () => {
      const initialQuantityOnHand = 100
      it('should reduce inventory levels of that consumable appropriately', () =>
        runTest(async knex => {
          const { basicDevicePayload, deviceAuth, device, site } = context

          const consumableAssay = await knex('ConsumableAssay as ca')
            .join('Assay as a', 'ca.assayId', 'a.id')
            .join('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
            .where({ 'dt.externalId': basicDevicePayload.type.id })
            .andWhere('ca.quantity', '>', 0)
            .first('ca.consumableId', 'ca.quantity', 'a.externalId as assayId')

          await knex('InventoryItem').insert({
            consumableId: consumableAssay.consumableId,
            siteId: site.id,
            quantityOnHand: initialQuantityOnHand,
          })

          assert.isNotEmpty(consumableAssay)
          assert.isAbove(consumableAssay.quantity, 0)

          const testStartedOn = setMilliseconds(subDays(context.now, 3), 0)
          const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, _.assign({}, basicDevicePayload, basicResultPayload), {
                result: _.assign({}, basicResultPayload.result, {
                  id: dateFormat(new Date(), 'T'),
                  startedOn: testStartedOn,
                  endedOn: testEndedOn,
                  sample: { id: 'Existing Sample' },
                  instrument: { serial: '123456799' },
                  assay: {
                    id: consumableAssay.assayId,
                    version: '2',
                  },
                  data: {
                    assay: Object.keys(assayNameToExternalId).find(
                      assayName => assayNameToExternalId[assayName] === consumableAssay.assayId
                    ),
                  },
                }),
              })
            )
            .then(res => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const lastResultId = await getLastResultId(knex, device.id)

          const { quantityOnHand, inventoryItemId } = await knex('InventoryLog as il')
            .join('InventoryItem as ii', 'ii.id', 'il.inventoryItemId')
            .where({ resultId: lastResultId })
            .first('ii.quantityOnHand', 'il.inventoryItemId')
          const inventoryItem = await knex('InventoryItem').where({ id: inventoryItemId }).first()
          assert.equal(quantityOnHand, 99)

          const inventoryLogs = await knex('InventoryLog as il')
            .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
            .where({ inventoryItemId })
            .select('il.consumableId', 'il.siteId', 'cr.externalId as consumableReason', 'il.resultId', 'il.quantity')
          assert.deepEqual(inventoryLogs, [
            {
              consumableId: inventoryItem.consumableId,
              siteId: site.id,
              consumableReason: 'test_conducted',
              resultId: lastResultId,
              quantity: -consumableAssay.quantity,
            },
          ])
        }))

      describe('when the test already exists in the database', () => {
        it('should NOT reduce inventory levels of the consumable', () =>
          runTest(async knex => {
            const { basicDevicePayload, deviceAuth, now, site } = context
            const uniqueTestId = dateFormat(new Date(), 'T')

            const consumableAssays = await knex('ConsumableAssay as ca')
              .join('Assay as a', 'ca.assayId', 'a.id')
              .join('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
              .where({ 'dt.externalId': basicDevicePayload.type.id })
              .andWhere('ca.quantity', '>', 0)
              .select('ca.consumableId', 'ca.quantity', 'a.externalId as assayId')

            assert.isNotEmpty(consumableAssays)
            const [consumableAssay] = consumableAssays
            assert.isAbove(consumableAssay.quantity, 0)

            await knex('InventoryItem').insert({
              consumableId: consumableAssay.consumableId,
              siteId: site.id,
              quantityOnHand: initialQuantityOnHand,
            })

            const testStartedOn = setMilliseconds(
              subMinutes(subHours(now, Math.floor(Math.random() * 24)), Math.floor(Math.random() * 60)),
              0
            )
            const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
            const sampleId = 'GxConnect test reduces inventory'
            const instrumentSerial = '123456799'

            // Send first test
            await server
              .post('/device')
              .set('Authorization', deviceAuth)
              .send(
                _.assign({}, _.assign({}, basicDevicePayload, basicResultPayload), {
                  result: _.assign({}, basicResultPayload.result, {
                    id: uniqueTestId,
                    assay: {
                      id: consumableAssay.assayId,
                      version: '2',
                    },
                    data: {
                      assay: Object.keys(assayNameToExternalId).find(
                        assayName => assayNameToExternalId[assayName] === consumableAssay.assayId
                      ),
                    },
                    sample: { id: sampleId },
                    instrument: { serial: instrumentSerial },
                    startedOn: testStartedOn,
                    endedOn: testEndedOn,
                  }),
                })
              )
              .then(res => {
                assert.equal(res.status, 200)
                assert.typeOf(res.body, 'Object')
              })
              .catch(assert.fail)

            const beforeUpdateResultDetails = await getLastResult()

            const inventoryLogsAfterFirstRequest = await knex('InventoryLog as il')
              .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
              .join('InventoryItem as ii', 'ii.id', 'il.inventoryItemId')
              .where({ 'il.resultId': beforeUpdateResultDetails.id })
              .first(
                'il.consumableId',
                'il.siteId',
                'cr.name as consumableReason',
                'il.resultId',
                'il.quantity',
                'ii.quantityOnHand',
                'ii.lotNumber',
                'ii.expiresOn'
              )

            await waitForApproximately(2, 'seconds')

            // Send second request for same test
            const newResultData = {
              customFieldData: {
                1: {
                  notAvailable: false,
                  label: 'HIV Status',
                  value: 'Positive',
                },
                2: {
                  notAvailable: false,
                  label: 'Visual Analysis',
                  value: 'Blood Stained',
                },
              },
            }
            await server
              .post('/device')
              .set('Authorization', deviceAuth)
              .send(
                _.assign({}, _.assign({}, basicDevicePayload, basicResultPayload), {
                  result: _.assign({}, basicResultPayload.result, {
                    id: uniqueTestId,
                    assay: {
                      id: consumableAssay.assayId,
                      version: '2',
                    },
                    sample: { id: sampleId },
                    instrument: { serial: instrumentSerial },
                    startedOn: testStartedOn,
                    endedOn: testEndedOn,
                    data: newResultData,
                  }),
                })
              )
              .then(res => {
                assert.equal(res.status, 200)
                assert.typeOf(res.body, 'Object')
              })
              .catch(assert.fail)

            const afterUpdateResultDetails = await getLastResult()
            assert.equal(afterUpdateResultDetails.id, beforeUpdateResultDetails.id)
            assert.equal(afterUpdateResultDetails.createdOn.toString(), beforeUpdateResultDetails.createdOn.toString())
            expect(afterUpdateResultDetails.updatedOn).to.be.above(beforeUpdateResultDetails.updatedOn)

            const inventoryLogsAfterSecondRequest = await knex('InventoryLog as il')
              .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
              .join('InventoryItem as ii', 'ii.id', 'il.inventoryItemId')
              .where({ 'il.resultId': afterUpdateResultDetails.id })
              .first(
                'il.consumableId',
                'il.siteId',
                'cr.name as consumableReason',
                'il.resultId',
                'il.quantity',
                'ii.quantityOnHand',
                'ii.lotNumber',
                'ii.expiresOn'
              )

            assert.deepEqual(
              inventoryLogsAfterSecondRequest,

              inventoryLogsAfterFirstRequest
            )

            const matchingConsumableAssayAfterSecondRequest = _.find(consumableAssays, {
              consumableId: inventoryLogsAfterSecondRequest.consumableId,
              quantity: -inventoryLogsAfterSecondRequest.quantity,
            })
            assert.isNotEmpty(matchingConsumableAssayAfterSecondRequest)
          }))
      })
    })

    describe('when an error code has been specified in the result payload', () => {
      it('should set the resultCategory1 of the result to error', () =>
        runTest(async () => {
          const { basicDevicePayload, deviceAuth } = context

          const errorTestResultId = 'UNIQUE-ID-WITH-ERROR-RESULT'
          const errorCode = '12345'

          const testStartedOn = setMilliseconds(subDays(context.now, 3), 0)
          const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, _.assign({}, basicDevicePayload, basicResultPayload), {
                result: _.assign({}, basicResultPayload.result, {
                  id: errorTestResultId,
                  startedOn: testStartedOn,
                  endedOn: testEndedOn,
                  error: {
                    code: errorCode,
                  },
                }),
              })
            )
            .then(res => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const lastResult = await getLastResult()
          assert.deepEqual(_.pick(lastResult, 'errorCode', 'resultCategory1'), {
            errorCode,
            resultCategory1: 'Error',
          })
          assert.equal(lastResult.resultData.geneXpertTestId, errorTestResultId)
        }))
    })

    describe('when the result was previously sent', () => {
      describe('incomplete with no end time', () => {
        describe('and is sent again with an end time and a result', () => {
          it("should merge with the existing result, matched by instrument and cartridge serials, and update it's external ID", () =>
            runTest(async () => {
              const { deviceAuth, now } = context
              const instrumentSerial = '123456799'
              const cartridgeSerial = '725194650'
              const startedOnDate = setMilliseconds(now, 0)
              const startedOn = dateFormat(startedOnDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")
              const incompleteResultPayload = _.merge(
                {},
                basicDevicePayload,
                { name: deviceName },
                basicResultPayload,
                {
                  result: {
                    startedOn,
                    endedOn: null,
                    instrument: {
                      serial: instrumentSerial,
                    },
                    consumable: {
                      serial: cartridgeSerial,
                    },
                    data: { resultText: 'NO RESULT' },
                  },
                }
              )
              delete incompleteResultPayload.result.id
              // Initial incomplete result details
              await server
                .post('/device')
                .set('Authorization', deviceAuth)
                .send(incompleteResultPayload)
                .then(res => {
                  assert.equal(res.status, 200)
                })
                .catch(assert.fail)

              const incompleteResult = await getLastResult()
              expect(incompleteResult).to.containSubset({
                resultCategory1: 'NoResult',
                resultCategory2: null,
                startedOn: startedOnDate,
                endedOn: null,
                resultData: {
                  resultText: 'NO RESULT',
                },
              })

              const endedOnDate = addMinutes(startedOnDate, 103)
              const endedOn = dateFormat(endedOnDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")

              const completeResultPayload = _.merge({}, incompleteResultPayload, {
                result: {
                  endedOn,
                  data: { resultText: 'DETECTED MEDIUM|INDETERMINATE|' },
                },
              })
              // Then complete result details
              await server
                .post('/device')
                .set('Authorization', deviceAuth)
                .send(completeResultPayload)
                .then(res => {
                  assert.equal(res.status, 200)
                })
                .catch(assert.fail)

              const completeResult = await getLastResult()
              expect(completeResult).to.containSubset({
                resultCategory1: 'Detected',
                resultCategory2: 'Indeterminate',
                startedOn: startedOnDate,
                endedOn: endedOnDate,
                resultData: {
                  resultText: 'DETECTED MEDIUM|INDETERMINATE|',
                },
              })
              assert.equal(completeResult.id, incompleteResult.id)
              assert.notEqual(completeResult.externalId, incompleteResult.externalId)
            }))
        })
      })

      describe('complete with result', () => {
        describe('and is sent again with no result in the result text', () => {
          it('should ignore the result data that has been sent', () =>
            runTest(async () => {
              const { deviceAuth, now } = context
              const instrumentSerial = '123456799'
              const cartridgeSerial = '725194660'
              const startedOnDate = setMilliseconds(now, 0)
              const startedOn = dateFormat(startedOnDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")

              const endedOnDate = addMinutes(startedOnDate, 103)
              const endedOn = dateFormat(endedOnDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")

              const completeResultPayload = _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
                result: {
                  startedOn,
                  endedOn,
                  instrument: {
                    serial: instrumentSerial,
                  },
                  consumable: {
                    serial: cartridgeSerial,
                  },
                  data: {
                    resultText: 'MTB DETECTED MEDIUM||RIF Resistance NOT DETECTED',
                  },
                },
              })
              // Initial complete result details
              await server
                .post('/device')
                .set('Authorization', deviceAuth)
                .send(completeResultPayload)
                .then(res => {
                  assert.equal(res.status, 200)
                })
                .catch(assert.fail)
              const result1 = await getLastResult()
              expect(result1).to.containSubset({
                resultCategory1: 'Detected',
                resultCategory2: 'NotDetected',
                startedOn: startedOnDate,
                endedOn: endedOnDate,
                resultData: {
                  resultText: 'MTB DETECTED MEDIUM||RIF Resistance NOT DETECTED',
                },
              })

              // Then send NO RESULT
              await server
                .post('/device')
                .set('Authorization', deviceAuth)
                .send(
                  _.merge({}, completeResultPayload, {
                    result: {
                      data: { resultText: 'NO RESULT|NO RESULT|' },
                    },
                  })
                )
                .then(res => {
                  assert.equal(res.status, 200)
                })
                .catch(assert.fail)
              const result2 = await getLastResult()
              expect(result2).to.containSubset({
                resultCategory1: 'Detected',
                resultCategory2: 'NotDetected',
                startedOn: startedOnDate,
                endedOn: endedOnDate,
                resultData: {
                  resultText: 'MTB DETECTED MEDIUM||RIF Resistance NOT DETECTED',
                },
              })
              assert.equal(result2.id, result1.id)

              await server
                .post('/device')
                .set('Authorization', deviceAuth)
                .send(
                  _.merge({}, completeResultPayload, {
                    result: {
                      data: { resultText: 'NO RESULT' },
                    },
                  })
                )
                .then(res => {
                  assert.equal(res.status, 200)
                })
                .catch(assert.fail)
              const result3 = await getLastResult()
              expect(result3).to.containSubset({
                resultCategory1: 'Detected',
                resultCategory2: 'NotDetected',
                startedOn: startedOnDate,
                endedOn: endedOnDate,
                resultData: {
                  resultText: 'MTB DETECTED MEDIUM||RIF Resistance NOT DETECTED',
                },
              })
              assert.equal(result3.id, result1.id)

              await server
                .post('/device')
                .set('Authorization', deviceAuth)
                .send(
                  _.merge({}, completeResultPayload, {
                    result: {
                      data: { resultText: 'MTB DETECTED MEDIUM|NO RESULT' },
                    },
                  })
                )
                .then(res => {
                  assert.equal(res.status, 200)
                })
                .catch(assert.fail)
              const result4 = await getLastResult()
              expect(result4).to.containSubset({
                resultCategory1: 'Detected',
                resultCategory2: 'NoResult',
                startedOn: startedOnDate,
                endedOn: endedOnDate,
                resultData: {
                  resultText: 'MTB DETECTED MEDIUM|NO RESULT',
                },
              })
              assert.equal(result4.id, result1.id)
            }))
        })
      })
    })
  })

  // Take a look at the comments here: https://systemone.youtrack.cloud/issue/ASP-7740/Solve-Inventory-Items-duplicates
  describe.skip('inventory changes', () => {
    const context = createGxConnectTestContext(server, {
      countryCode,
      adminUsername,
      adminPassword,
      deviceName,
      macAddress,
      deviceSerialNumber,
    })
    beforeEach(context.beforeRegisterAndSetDevice)
    const { runTest } = context
    afterEach(context.afterCleanUp)

    it('should create inventory items that do not exist', () =>
      runTest(async knex => {
        const { basicDevicePayload, deviceAuth, site, now } = context
        const inventoryItemsAtSiteBefore = await knex('InventoryItem').where({ siteId: site.id }).select()
        assert.isEmpty(inventoryItemsAtSiteBefore)

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const expirationDate = dateFormat(addYears(now, 1).setHours(0, 0, 0, 0), "yyyy-MM-dd'T'HH:mm:ss'Z'")
        const consumableName = 'Xpert HIV-1 Qual Cartridge'
        const consumableReason = 'Physical Count'
        const initialQuantity = 100
        const quantity = 5

        await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(
            _.assign({}, basicDevicePayload, {
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
            })
          )
          .then(res => {
            assert.equal(res.status, 200, res.text)
            assert.typeOf(res.body, 'Object')
          })
          .catch(assert.fail)

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: site.id })
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        assert.deepEqual(
          _.map(inventoryItemsAtSiteAfter, inventoryItem => _.omit(inventoryItem, 'id')),
          [
            {
              consumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: new Date(expirationDate),
              quantityOnHand: _.max([0, initialQuantity + quantity]),
            },
          ]
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
            'il.transactionDate'
          )
        assert.deepEqual(inventoryLog, [
          {
            consumableName,
            siteId: site.id,
            consumableReason,
            resultId: null,
            operation: 'add from GxConnect',
            lotNumber: null,
            expiresOn: new Date(expirationDate),
            quantity,
            notes: null,
            transactionDate: setMilliseconds(startedOn, 0),
          },
        ])
      }))

    describe('inventory update', () => {
      const initialQuantityOnHand = 100
      beforeEach(() =>
        run(async knex => {
          const {
            basicDevicePayload,
            site: { id: siteId },
          } = context
          const consumableAssay = await knex('ConsumableAssay as ca')
            .join('Assay as a', 'ca.assayId', 'a.id')
            .join('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
            .where({ 'dt.externalId': basicDevicePayload.type.id })
            .andWhere('ca.quantity', '>', 0)
            .first('ca.consumableId', 'ca.quantity', 'a.externalId as assayId')

          assert.isNotEmpty(consumableAssay)
          assert.isAbove(consumableAssay.quantity, 0)

          const expiryDate = new Date(addYears(new Date(), 1).setHours(0, 0, 0, 0))
          await knex('InventoryItem').insert({
            consumableId: consumableAssay.consumableId,
            siteId,
            expiresOn: expiryDate,
            quantityOnHand: initialQuantityOnHand,
          })
        })
      )
      it('should ignore changes for consumables that are unknown', () =>
        runTest(async knex => {
          const { basicDevicePayload, deviceAuth, site, now } = context
          const inventoryItemsAtSiteBefore = await knex('InventoryItem').where({ siteId: site.id }).select()

          const startedOn = subHours(subDays(now, 1), 2)
          const endedOn = subHours(now, 2)
          const expirationDate = new Date(addYears(now, 1).setHours(0, 0, 0, 0))

          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, basicDevicePayload, {
                operation: {
                  startedOn,
                  endedOn,
                  data: {
                    inventoryChanges: [
                      {
                        consumableName: 'Unknown consumable type',
                        consumableReasonName: 'Physical Count',
                        quantity: 12,
                        resultingQuantityOnHand: 112,
                        dateChanged: startedOn,
                        expirationDate,
                      },
                    ],
                  },
                },
              })
            )
            .then(res => {
              assert.equal(res.status, 200, res.text)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const inventoryItemsAtSiteAfter = await knex('InventoryItem').where({ siteId: site.id }).select()
          assert.deepEqual(inventoryItemsAtSiteBefore, inventoryItemsAtSiteAfter)
        }))

      it('should accept all types of GeneXpert cartridges', () =>
        runTest(async knex => {
          const { basicDevicePayload, deviceAuth, site, now } = context

          const inventoryItemsAtSiteBefore = await knex('InventoryItem').where({ siteId: site.id }).pluck('id')

          const startedOn = subHours(subDays(now, 1), 2)
          const endedOn = subHours(now, 2)
          const consumableReason = 'Physical Count'

          const inventoryChanges = [
            {
              consumableName: 'GeneXpert TB Cartridge',
              consumableReasonName: consumableReason,
              quantity: 13,
              resultingQuantityOnHand: 86,
              dateChanged: addHours(startedOn, 1),
              expirationDate: dateFormat(
                new Date(subDays(addYears(now, 1), 1).setHours(0, 0, 0, 0)),
                "yyyy-MM-dd'T'HH:mm:ss'Z'"
              ),
            },
            {
              consumableName: 'GeneXpert Ebola Cartridge',
              consumableReasonName: consumableReason,
              quantity: 3,
              resultingQuantityOnHand: 21,
              dateChanged: addHours(startedOn, 2),
              expirationDate: dateFormat(
                new Date(subDays(addYears(now, 1), 3).setHours(0, 0, 0, 0)),
                "yyyy-MM-dd'T'HH:mm:ss'Z'"
              ),
            },
            {
              consumableName: 'Xpert HIV-1 Qual Cartridge',
              consumableReasonName: consumableReason,
              quantity: 44,
              resultingQuantityOnHand: 50,
              dateChanged: addHours(startedOn, 3),
              expirationDate: dateFormat(
                new Date(subDays(addYears(now, 1), 3).setHours(0, 0, 0, 0)),
                "yyyy-MM-dd'T'HH:mm:ss'Z'"
              ),
            },
            {
              consumableName: 'Xpert HIV-1 Viral Load Cartridge',
              consumableReasonName: consumableReason,
              quantity: 1,
              resultingQuantityOnHand: 13,
              dateChanged: addHours(startedOn, 4),
              expirationDate: dateFormat(
                new Date(subDays(addYears(now, 1), 4).setHours(0, 0, 0, 0)),
                "yyyy-MM-dd'T'HH:mm:ss'Z'"
              ),
            },
            {
              consumableName: 'GeneXpert TB Ultra Cartridge',
              consumableReasonName: consumableReason,
              quantity: 26,
              resultingQuantityOnHand: 41,
              dateChanged: addHours(startedOn, 5),
              expirationDate: dateFormat(
                new Date(subDays(addYears(now, 1), 8).setHours(0, 0, 0, 0)),
                "yyyy-MM-dd'T'HH:mm:ss'Z'"
              ),
            },
          ]

          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, basicDevicePayload, {
                operation: {
                  startedOn,
                  endedOn,
                  data: { inventoryChanges },
                },
              })
            )
            .then(res => {
              assert.equal(res.status, 200, res.text)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: site.id })
            .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
            .select(
              'ii.id',
              'c.name as consumableName',
              'ii.inTransitFromSiteId',
              'ii.lotNumber',
              'ii.expiresOn',
              'ii.quantityOnHand'
            )
          assert.deepEqual(
            _.sortBy(
              _.map(inventoryItemsAtSiteAfter, inventoryItem => _.omit(inventoryItem, 'id')),
              'consumableName'
            ),
            _.sortBy(
              _.map(inventoryChanges, inventoryChange => ({
                consumableName: inventoryChange.consumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: new Date(inventoryChange.expirationDate),
                quantityOnHand: inventoryChange.resultingQuantityOnHand,
              })),
              'consumableName'
            )
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
              'il.transactionDate'
            )

          assert.deepEqual(
            _.sortBy(inventoryLog, ['consumableName', 'consumableReason']),
            _.sortBy(
              _.map(inventoryChanges, inventoryChange => ({
                consumableName: inventoryChange.consumableName,
                siteId: site.id,
                consumableReason,
                resultId: null,
                operation: 'add from GxConnect',
                lotNumber: null,
                expiresOn: new Date(inventoryChange.expirationDate),
                quantity: Math.abs(inventoryChange.quantity),
                notes: null,
                transactionDate: setMilliseconds(inventoryChange.dateChanged, 0),
              })),
              ['consumableName', 'consumableReason']
            )
          )
        }))

      it('should increase the quantity inventory items that do exist', () =>
        runTest(async knex => {
          const { basicDevicePayload, deviceAuth, site, now } = context
          const inventoryItemAtSiteBefore = await knex('InventoryItem as ii')
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: site.id })
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
          const consumableReason = 'Physical Count'
          const quantity = 13
          const resultingQuantityOnHand = inventoryItemAtSiteBefore.quantityOnHand + quantity

          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, basicDevicePayload, {
                operation: {
                  startedOn,
                  endedOn,
                  data: {
                    inventoryChanges: [
                      {
                        consumableName: inventoryItemAtSiteBefore.consumableName,
                        consumableReasonName: consumableReason,
                        quantity,
                        resultingQuantityOnHand,
                        dateChanged: startedOn,
                        expirationDate: inventoryItemAtSiteBefore.expiresOn,
                      },
                    ],
                  },
                },
              })
            )
            .then(res => {
              assert.equal(res.status, 200, res.text)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

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
          assert.deepEqual(
            _.map(inventoryItemsAtSiteAfter, inventoryItem => _.omit(inventoryItem, 'id')),
            [
              {
                consumableName: inventoryItemAtSiteBefore.consumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: inventoryItemAtSiteBefore.expiresOn,
                quantityOnHand: _.max([0, resultingQuantityOnHand]),
              },
            ]
          )

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
              'il.transactionDate'
            )

          assert.deepEqual(inventoryLog, {
            consumableName: inventoryItemAtSiteBefore.consumableName,
            siteId: site.id,
            consumableReason,
            resultId: null,
            operation: 'add from GxConnect',
            lotNumber: null,
            expiresOn: inventoryItemAtSiteBefore.expiresOn,
            quantity,
            notes: null,
            transactionDate: setMilliseconds(startedOn, 0),
          })
        }))

      it('should decrease the quantity on hand of existing inventory items', () =>
        runTest(async knex => {
          const { basicDevicePayload, deviceAuth, site, now } = context
          const inventoryItemAtSiteBefore = await knex('InventoryItem as ii')
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: site.id })
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
          const consumableReason = 'Physical Count'
          const quantity = -3
          const resultingQuantityOnHand = inventoryItemAtSiteBefore.quantityOnHand + quantity

          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, basicDevicePayload, {
                operation: {
                  startedOn,
                  endedOn,
                  data: {
                    inventoryChanges: [
                      {
                        consumableName: inventoryItemAtSiteBefore.consumableName,
                        consumableReasonName: consumableReason,
                        quantity,
                        resultingQuantityOnHand,
                        dateChanged: startedOn,
                        expirationDate: inventoryItemAtSiteBefore.expiresOn,
                      },
                    ],
                  },
                },
              })
            )
            .then(res => {
              assert.equal(res.status, 200, res.text)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

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

          assert.deepEqual(
            _.map(inventoryItemsAtSiteAfter, inventoryItem => _.omit(inventoryItem, 'id')),
            [
              {
                consumableName: inventoryItemAtSiteBefore.consumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: inventoryItemAtSiteBefore.expiresOn,
                quantityOnHand: _.max([0, resultingQuantityOnHand]),
              },
            ]
          )

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
              'il.transactionDate'
            )

          assert.deepEqual(inventoryLog, {
            consumableName: inventoryItemAtSiteBefore.consumableName,
            siteId: site.id,
            consumableReason,
            resultId: null,
            operation: 'remove from GxConnect',
            lotNumber: null,
            expiresOn: inventoryItemAtSiteBefore.expiresOn,
            quantity,
            notes: null,
            transactionDate: setMilliseconds(startedOn, 0),
          })
        }))
    })

    it('should accept different reasons', () =>
      runTest(async knex => {
        const { basicDevicePayload, deviceAuth, site, now } = context

        const inventoryItemsAtSiteBefore = await knex('InventoryItem').where({ siteId: site.id }).pluck('id')

        const startedOn = subDays(now, 1)
        const endedOn = addHours(startedOn, 2)

        const inventoryChanges = [
          {
            consumableName: 'GeneXpert TB Cartridge',
            consumableReasonName: 'Physical Count',
            quantity: 13,
            resultingQuantityOnHand: 73,
            dateChanged: subHours(startedOn, 1),
            expirationDate: dateFormat(
              new Date(subDays(addYears(now, 1), 5).setHours(0, 0, 0, 0)),
              "yyyy-MM-dd'T'HH:mm:ss'Z'"
            ),
          },
          {
            consumableName: 'GeneXpert Ebola Cartridge',
            consumableReasonName: 'Physical Count',
            quantity: -3,
            resultingQuantityOnHand: 18,
            dateChanged: subHours(startedOn, 2),
            expirationDate: dateFormat(
              new Date(subDays(addYears(now, 1), 6).setHours(0, 0, 0, 0)),
              "yyyy-MM-dd'T'HH:mm:ss'Z'"
            ),
          },
          {
            consumableName: 'Xpert HIV-1 Qual Cartridge',
            consumableReasonName: 'Transfer Sent',
            quantity: -4,
            resultingQuantityOnHand: 46,
            dateChanged: subHours(startedOn, 3),
            expirationDate: dateFormat(
              new Date(subDays(addYears(now, 1), 8).setHours(0, 0, 0, 0)),
              "yyyy-MM-dd'T'HH:mm:ss'Z'"
            ),
          },
          {
            consumableName: 'Xpert HIV-1 Viral Load Cartridge',
            consumableReasonName: 'Transfer Received',
            quantity: 11,
            resultingQuantityOnHand: 24,
            dateChanged: subHours(startedOn, 4),
            expirationDate: dateFormat(
              new Date(subDays(addYears(now, 1), 3).setHours(0, 0, 0, 0)),
              "yyyy-MM-dd'T'HH:mm:ss'Z'"
            ),
          },
          {
            consumableName: 'GeneXpert TB Ultra Cartridge',
            consumableReasonName: 'Lost',
            quantity: -6,
            resultingQuantityOnHand: 30,
            dateChanged: subHours(startedOn, 5),
            expirationDate: dateFormat(
              new Date(subDays(addYears(now, 1), 7).setHours(0, 0, 0, 0)),
              "yyyy-MM-dd'T'HH:mm:ss'Z'"
            ),
          },
          {
            consumableName: 'GeneXpert TB Cartridge',
            consumableReasonName: 'Expired',
            quantity: -6,
            resultingQuantityOnHand: 50,
            dateChanged: subHours(startedOn, 6),
            expirationDate: dateFormat(
              new Date(subDays(addYears(now, 1), 2).setHours(0, 0, 0, 0)),
              "yyyy-MM-dd'T'HH:mm:ss'Z'"
            ),
          },
        ]

        await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(
            _.assign({}, basicDevicePayload, {
              operation: {
                startedOn,
                endedOn,
                data: { inventoryChanges },
              },
            })
          )
          .then(res => {
            assert.equal(res.status, 200, res.text)
            assert.typeOf(res.body, 'Object')
          })
          .catch(assert.fail)

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: site.id })
          .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        assert.deepEqual(
          _.sortBy(
            _.map(inventoryItemsAtSiteAfter, inventoryItem => _.omit(inventoryItem, 'id')),
            ['consumableName', 'consumableReason', 'expiresOn']
          ),
          _.sortBy(
            _.map(inventoryChanges, inventoryChange => ({
              consumableName: inventoryChange.consumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: new Date(inventoryChange.expirationDate),
              quantityOnHand: inventoryChange.resultingQuantityOnHand,
            })),
            ['consumableName', 'consumableReason', 'expiresOn']
          )
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
            'il.transactionDate'
          )

        assert.deepEqual(
          _.sortBy(inventoryLog, ['consumableName', 'consumableReason', 'expiresOn']),
          _.sortBy(
            _.map(inventoryChanges, inventoryChange => ({
              consumableName: inventoryChange.consumableName,
              siteId: site.id,
              consumableReason: inventoryChange.consumableReasonName,
              resultId: null,
              operation: inventoryChange.quantity >= 0 ? 'add from GxConnect' : 'remove from GxConnect',
              lotNumber: null,
              expiresOn: new Date(inventoryChange.expirationDate),
              quantity: Math.abs(inventoryChange.quantity),
              notes: null,
              transactionDate: setMilliseconds(inventoryChange.dateChanged, 0),
            })),
            ['consumableName', 'consumableReason', 'expiresOn']
          )
        )
      }))

    it('should identify lots based on expiration date and adjust the quantity of the correct lot', () =>
      runTest(async knex => {
        const { basicDevicePayload, deviceAuth, site, now } = context

        const inventoryItemsAtSiteBefore = await knex('InventoryItem').where({ siteId: site.id }).pluck('id')

        const startedOn = subDays(now, 5)
        const endedOn = addHours(startedOn, 2)

        const lot1 = {
          consumableName: 'GeneXpert TB Cartridge',
          consumableReasonName: 'Physical Count',
          quantity: 73,
          resultingQuantityOnHand: 73,
          dateChanged: subHours(startedOn, 2),
          expirationDate: dateFormat(
            new Date(subDays(addYears(now, 1), 21).setHours(0, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          ),
        }
        const lot2 = {
          consumableName: 'GeneXpert TB Cartridge',
          consumableReasonName: 'Physical Count',
          quantity: 38,
          resultingQuantityOnHand: 38,
          dateChanged: subHours(startedOn, 2),
          expirationDate: dateFormat(
            new Date(subDays(addYears(now, 1), 33).setHours(0, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          ),
        }

        await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(
            _.assign({}, basicDevicePayload, {
              operation: {
                startedOn,
                endedOn,
                data: { inventoryChanges: [lot1, lot2] },
              },
            })
          )
          .then(res => {
            assert.equal(res.status, 200, res.text)
            assert.typeOf(res.body, 'Object')
          })
          .catch(assert.fail)

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: site.id })
          .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        assert.deepEqual(
          _.sortBy(
            _.map(inventoryItemsAtSiteAfter, inventoryItem => _.omit(inventoryItem, 'id')),
            'expiresOn'
          ),
          _.sortBy(
            _.map([lot1, lot2], inventoryChange => ({
              consumableName: inventoryChange.consumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: new Date(inventoryChange.expirationDate),
              quantityOnHand: inventoryChange.resultingQuantityOnHand,
            })),
            'expiresOn'
          )
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
            'il.transactionDate'
          )

        assert.deepEqual(
          _.sortBy(
            _.map(inventoryLogs, inventoryLog => _.omit(inventoryLog, 'id')),
            ['consumableName', 'consumableReason', 'expiresOn']
          ),
          _.sortBy(
            _.map([lot1, lot2], inventoryChange => ({
              consumableName: inventoryChange.consumableName,
              siteId: site.id,
              consumableReason: inventoryChange.consumableReasonName,
              resultId: null,
              operation: inventoryChange.quantity >= 0 ? 'add from GxConnect' : 'remove from GxConnect',
              lotNumber: null,
              expiresOn: new Date(inventoryChange.expirationDate),
              quantity: Math.abs(inventoryChange.quantity),
              notes: null,
              transactionDate: setMilliseconds(inventoryChange.dateChanged, 0),
            })),
            ['consumableName', 'consumableReason', 'expiresOn']
          )
        )

        const updateToLot1 = _.assign({}, lot1, {
          consumableReasonName: 'Stolen',
          quantity: -3,
          resultingQuantityOnHand: 70,
          dateChanged: subHours(startedOn, 1),
        })

        await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(
            _.assign({}, basicDevicePayload, {
              operation: {
                startedOn,
                endedOn,
                data: { inventoryChanges: [updateToLot1] },
              },
            })
          )
          .then(res => {
            assert.equal(res.status, 200, res.text)
            assert.typeOf(res.body, 'Object')
          })
          .catch(assert.fail)

        const lot1InventoryItem = _.find(inventoryItemsAtSiteAfter, {
          expiresOn: new Date(lot1.expirationDate),
        })
        const lot2InventoryItem = _.find(inventoryItemsAtSiteAfter, {
          expiresOn: new Date(lot2.expirationDate),
        })
        const lot1InventoryItemAfterAdjustment1 = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ 'ii.id': lot1InventoryItem.id })
          .first(
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        const lot2InventoryItemAfterAdjustment1 = await knex('InventoryItem as ii')
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
          expiresOn: new Date(lot1.expirationDate),
          quantityOnHand: _.max([0, lot1InventoryItem.quantityOnHand + updateToLot1.quantity]),
        })
        assert.deepEqual(lot2InventoryItemAfterAdjustment1, {
          consumableName: lot2.consumableName,
          inTransitFromSiteId: null,
          lotNumber: null,
          expiresOn: new Date(lot2.expirationDate),
          quantityOnHand: lot2.resultingQuantityOnHand,
        })

        const updateToLot2 = _.assign({}, lot2, {
          consumableReasonName: 'Transfer Received',
          quantity: 100,
          resultingQuantityOnHand: 138,
          dateChanged: subHours(startedOn, 1),
        })

        await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(
            _.assign({}, basicDevicePayload, {
              operation: {
                startedOn,
                endedOn,
                data: { inventoryChanges: [updateToLot2] },
              },
            })
          )
          .then(res => {
            assert.equal(res.status, 200, res.text)
            assert.typeOf(res.body, 'Object')
          })
          .catch(assert.fail)

        const lot1InventoryItemAfterAdjustment2 = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ 'ii.id': lot1InventoryItem.id })
          .first(
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        const lot2InventoryItemAfterAdjustment2 = await knex('InventoryItem as ii')
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
          expiresOn: new Date(lot1.expirationDate),
          quantityOnHand: _.max([0, lot1InventoryItem.quantityOnHand + updateToLot1.quantity]),
        })
        assert.deepEqual(lot2InventoryItemAfterAdjustment2, {
          consumableName: lot2.consumableName,
          inTransitFromSiteId: null,
          lotNumber: null,
          expiresOn: new Date(lot2.expirationDate),
          quantityOnHand: _.max([0, lot2InventoryItem.quantityOnHand + updateToLot2.quantity]),
        })
        const inventoryLogsForLot1And2 = await knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .join('Consumable as c', 'il.consumableId', 'c.id')
          .whereIn('il.inventoryItemId', [lot1InventoryItem.id, lot2InventoryItem.id])
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
            'il.transactionDate'
          )
        assert.deepEqual(
          _.sortBy(inventoryLogsForLot1And2, ['consumableName', 'consumableReason', 'expiresOn']),
          _.sortBy(
            [
              {
                consumableName: lot1.consumableName,
                siteId: site.id,
                consumableReason: lot1.consumableReasonName,
                resultId: null,
                operation: 'add from GxConnect',
                lotNumber: null,
                expiresOn: new Date(lot1.expirationDate),
                quantity: Math.abs(lot1.resultingQuantityOnHand),
                notes: null,
                transactionDate: setMilliseconds(lot1.dateChanged, 0),
              },
              {
                consumableName: lot2.consumableName,
                siteId: site.id,
                consumableReason: lot2.consumableReasonName,
                resultId: null,
                operation: 'add from GxConnect',
                lotNumber: null,
                expiresOn: new Date(lot2.expirationDate),
                quantity: Math.abs(lot2.resultingQuantityOnHand),
                notes: null,
                transactionDate: setMilliseconds(lot2.dateChanged, 0),
              },
              {
                consumableName: lot1.consumableName,
                siteId: site.id,
                consumableReason: updateToLot1.consumableReasonName,
                resultId: null,
                operation: 'remove from GxConnect',
                lotNumber: null,
                expiresOn: new Date(lot1.expirationDate),
                quantity: updateToLot1.quantity,
                notes: null,
                transactionDate: setMilliseconds(updateToLot1.dateChanged, 0),
              },
              {
                consumableName: lot2.consumableName,
                siteId: site.id,
                consumableReason: updateToLot2.consumableReasonName,
                resultId: null,
                operation: 'add from GxConnect',
                lotNumber: null,
                expiresOn: new Date(lot2.expirationDate),
                quantity: Math.abs(updateToLot2.quantity),
                notes: null,
                transactionDate: setMilliseconds(updateToLot2.dateChanged, 0),
              },
            ],
            ['consumableName', 'consumableReason', 'expiresOn']
          )
        )
      }))

    describe('when quantity on hand is explicitly specified in the data', () => {
      it('should overwrite the quantity on hand in the inventory record', () =>
        runTest(async knex => {
          const { basicDevicePayload, deviceAuth, site, now } = context

          const inventoryItemsAtSiteBefore = await knex('InventoryItem').where({ siteId: site.id }).pluck('id')

          const startedOn = subDays(now, 7)
          const endedOn = addHours(startedOn, 2)
          const expirationDate = dateFormat(
            new Date(subDays(addYears(now, 1), 15).setHours(0, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          )

          const initialLotCaptured = {
            consumableName: 'GeneXpert TB Cartridge',
            consumableReasonName: 'Physical Count',
            quantity: 25,
            resultingQuantityOnHand: 25,
            dateChanged: subHours(startedOn, 2),
            expirationDate,
          }

          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, basicDevicePayload, {
                operation: {
                  startedOn,
                  endedOn,
                  data: { inventoryChanges: [initialLotCaptured] },
                },
              })
            )
            .then(res => {
              assert.equal(res.status, 200, res.text)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const inventoryItemsAtSiteAfterCapture = await knex('InventoryItem as ii')
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: site.id })
            .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
            .select(
              'ii.id',
              'c.name as consumableName',
              'ii.inTransitFromSiteId',
              'ii.lotNumber',
              'ii.expiresOn',
              'ii.quantityOnHand'
            )
          assert.deepEqual(
            _.sortBy(
              _.map(inventoryItemsAtSiteAfterCapture, inventoryItem => _.omit(inventoryItem, 'id')),
              'expiresOn'
            ),
            [
              {
                consumableName: initialLotCaptured.consumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: new Date(initialLotCaptured.expirationDate),
                quantityOnHand: initialLotCaptured.resultingQuantityOnHand,
              },
            ]
          )

          const inventoryLost = {
            consumableName: 'GeneXpert TB Cartridge',
            consumableReasonName: 'Lost',
            quantity: -5,
            resultingQuantityOnHand: 999,
            dateChanged: subHours(startedOn, 1),
            expirationDate,
          }

          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, basicDevicePayload, {
                operation: {
                  startedOn,
                  endedOn,
                  data: { inventoryChanges: [inventoryLost] },
                },
              })
            )
            .then(res => {
              assert.equal(res.status, 200, res.text)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const inventoryItemsAtSiteAfterLoss = await knex('InventoryItem as ii')
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: site.id })
            .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
            .select(
              'ii.id',
              'c.name as consumableName',
              'ii.inTransitFromSiteId',
              'ii.lotNumber',
              'ii.expiresOn',
              'ii.quantityOnHand'
            )
          assert.deepEqual(
            _.sortBy(
              _.map(inventoryItemsAtSiteAfterLoss, inventoryItem => _.omit(inventoryItem, 'id')),
              'expiresOn'
            ),
            [
              {
                consumableName: inventoryLost.consumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: new Date(inventoryLost.expirationDate),
                quantityOnHand: inventoryLost.resultingQuantityOnHand,
              },
            ]
          )
        }))
    })

    describe('when quantity on hand is not specified in the data', () => {
      it('should calculate the quantity on hand in the inventory record', () =>
        runTest(async knex => {
          const { basicDevicePayload, deviceAuth, site, now } = context

          const inventoryItemsAtSiteBefore = await knex('InventoryItem').where({ siteId: site.id }).pluck('id')

          const startedOn = subDays(now, 9)
          const endedOn = addHours(startedOn, 2)
          const expirationDate = dateFormat(
            new Date(subDays(addYears(now, 1), 15).setHours(0, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          )

          const initialLotCaptured = {
            consumableName: 'GeneXpert TB Cartridge',
            consumableReasonName: 'Physical Count',
            quantity: 25,
            dateChanged: subHours(startedOn, 2),
            expirationDate,
          }

          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, basicDevicePayload, {
                operation: {
                  startedOn,
                  endedOn,
                  data: { inventoryChanges: [initialLotCaptured] },
                },
              })
            )
            .then(res => {
              assert.equal(res.status, 200, res.text)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const inventoryItemsAtSiteAfterCapture = await knex('InventoryItem as ii')
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: site.id })
            .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
            .select(
              'ii.id',
              'c.name as consumableName',
              'ii.inTransitFromSiteId',
              'ii.lotNumber',
              'ii.expiresOn',
              'ii.quantityOnHand'
            )
          assert.deepEqual(
            _.sortBy(
              _.map(inventoryItemsAtSiteAfterCapture, inventoryItem => _.omit(inventoryItem, 'id')),
              'expiresOn'
            ),
            [
              {
                consumableName: initialLotCaptured.consumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: new Date(initialLotCaptured.expirationDate),
                quantityOnHand: initialLotCaptured.quantity,
              },
            ]
          )

          const inventoryLost = {
            consumableName: 'GeneXpert TB Cartridge',
            consumableReasonName: 'Lost',
            quantity: -5,
            dateChanged: subHours(startedOn, 1),
            expirationDate,
          }

          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, basicDevicePayload, {
                operation: {
                  startedOn,
                  endedOn,
                  data: { inventoryChanges: [inventoryLost] },
                },
              })
            )
            .then(res => {
              assert.equal(res.status, 200, res.text)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const inventoryItemsAtSiteAfterLoss = await knex('InventoryItem as ii')
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: site.id })
            .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
            .select(
              'ii.id',
              'c.name as consumableName',
              'ii.inTransitFromSiteId',
              'ii.lotNumber',
              'ii.expiresOn',
              'ii.quantityOnHand'
            )
          assert.deepEqual(
            _.sortBy(
              _.map(inventoryItemsAtSiteAfterLoss, inventoryItem => _.omit(inventoryItem, 'id')),
              'expiresOn'
            ),
            [
              {
                consumableName: inventoryLost.consumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: new Date(inventoryLost.expirationDate),
                quantityOnHand: _.max([0, initialLotCaptured.quantity + inventoryLost.quantity]),
              },
            ]
          )
        }))
    })
  })
  describe('Daily details', () => {
    describe('partner-level settings', () => {
      const context = createGxConnectTestContext(server, {
        countryCode,
        adminUsername,
        adminPassword,
        deviceName,
        macAddress,
      })
      let originalConfiguration = null
      beforeEach(context.beforeRegisterAndSetDevice)
      beforeEach(async () => {
        const { partnerId } = context.device
        const deviceTypeId = await deviceTypeToId('CepheidGeneXpert')
        originalConfiguration = await knexDb('DeviceConfiguration')
          .where({ partnerId, deviceTypeId })
          .first('id', 'data', 'updatedOn')

        assert.isOk(originalConfiguration)

        await knexDb('DeviceConfiguration')
          .where({ id: originalConfiguration.id })
          .update({
            data: JSON.stringify({
              EnableInventoryModule: true,
              AspectUploadExcludePatientId: true,
              GxAlertUploadExcludePatientId: true,
            }),
            updatedOn: new Date(),
          })
      })
      afterEach(async () => {
        if (originalConfiguration) {
          await knexDb('DeviceConfiguration').where({ id: originalConfiguration.id }).update({
            data: originalConfiguration.data,
            updatedOn: originalConfiguration.updatedOn,
          })
        }
      })
      afterEach(context.afterCleanUp)

      it('should receive updated deviceConfiguration for the partner and device type', async () => {
        const { deviceAuth, basicDevicePayload } = context
        let res = await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send({ ...basicDevicePayload, includeDeviceConfiguration: true })
          .catch(assert.fail)

        assert.equal(res.statusCode, 200)
        assert.deepEqual(res.body.deviceConfiguration, {
          EnableInventoryModule: true,
          AspectUploadExcludePatientId: true,
          GxAlertUploadExcludePatientId: true,
        })
        // the second time, device configuration it will be null because was already responded

        res = await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send({ ...basicDevicePayload, includeDeviceConfiguration: true })
          .catch(assert.fail)

        assert.equal(res.statusCode, 200)
        assert.isNull(res.body.deviceConfiguration)
      })
    })
  })
})
