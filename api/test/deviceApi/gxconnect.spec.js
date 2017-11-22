const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const subDays = require('date-fns/sub_days')
const addHours = require('date-fns/add_hours')
const setMilliseconds = require('date-fns/set_milliseconds')
const {
  createGxConnectTestContext,
  getLastResult,
} = require('./gxconnect_utils')
const { run } = require('../../src/db')

const server = supertest.agent('http://localhost:8080')
const assert = chai.assert

describe('Device API routes for GxConnect Devices', () => {
  const macAddress = 'MAC00000000FAKE'
  const adminUsername = 'admin'
  const adminPassword = 'test07'
  const countryCode = 'US'
  const deviceName = 'New GeneXpert Laboratory'
  const instrumentSerialNumbers = ['123456']

  describe('registration and configuration', () => {
    describe('when no device API key is specified', () => {
      const context = createGxConnectTestContext(server, {
        macAddress,
        adminUsername,
        adminPassword,
      })

      const runTest = context.runTest

      it('should respond with UNAUTHORIZED', () =>
        runTest(function*() {
          const { basicDevicePayload } = context
          yield server
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
      const context = createGxConnectTestContext(server, {
        macAddress,
        adminUsername,
        adminPassword,
      })

      const runTest = context.runTest

      it('should respond with UNAUTHORIZED', () =>
        runTest(function*() {
          const { basicDevicePayload } = context
          yield server
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
        describe('before a device name and country code have been specified', () => {
          const context = createGxConnectTestContext(server, {
            macAddress,
            adminUsername,
            adminPassword,
          })

          before(context.beforeRequestNewApiKey)
          const runTest = context.runTest
          after(context.afterCleanUp)

          it('should respond with NOT_FOUND', () =>
            runTest(function*() {
              const { deviceAuth, basicDevicePayload } = context
              yield server
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
            countryAbbreviation: countryCode,
            adminUsername,
            adminPassword,
            deviceName,
            macAddress,
          })

          before(context.beforeRegisterAndSetDevice)
          const runTest = context.runTest
          after(context.afterCleanUp)

          it('should respond with OK', () =>
            runTest(function*() {
              const { deviceAuth, basicDevicePayload } = context
              yield server
                .post('/device')
                .set('Authorization', deviceAuth)
                .send(basicDevicePayload)
                .then(res => {
                  assert.equal(res.statusCode, 200)
                })
                .catch(assert.fail)
            }))

          it('should have created a device and link it to the device API key', () =>
            runTest(function*(knex) {
              const { basicDevicePayload, apiKey } = context
              const deviceDetials = yield knex('DeviceApiKey as dak')
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
              assert.deepEqual(deviceDetials, [
                {
                  deviceName,
                  macAddress,
                  siteName: deviceName,
                  countryCode,
                  deviceType: basicDevicePayload.type.id,
                },
              ])
            }))
        })
      })
    })

    describe('generating a new device API key from a device with a known MAC address/instrument serial combination', () => {
      const firstContext = createGxConnectTestContext(server, {
        countryAbbreviation: countryCode,
        adminUsername,
        adminPassword,
        deviceName,
        macAddress,
        instrumentSerialNumbers,
      })

      before(firstContext.beforeRegisterAndSetDevice)
      after(firstContext.afterCleanUp)

      it('should not create a duplicate device', () =>
        firstContext.runTest(function*(knex) {
          // Check that device exists with MAC Address and Instrument Serial
          const firstDeviceUniqueIdentifiers = yield knex('DeviceApiKey as dak')
            .join('Device as d', 'dak.DeviceId', 'd.id')
            .where({ 'dak.token': firstContext.apiKey })
            .select('d.macAddress', 'd.serial')

          assert.deepEqual(firstDeviceUniqueIdentifiers, [
            {
              macAddress,
              serial: instrumentSerialNumbers.join(),
            },
          ])

          // Single device exists, now generate a new API key
          const secondContext = createGxConnectTestContext(server, {
            countryAbbreviation: countryCode,
            adminUsername,
            adminPassword,
            deviceName,
            macAddress,
            instrumentSerialNumbers,
          })

          yield* secondContext.registerAndSetDevice()

          yield* secondContext.runTestInline(function*(knex) {
            assert.notEqual(secondContext.apiKey, firstContext.apiKey)
            // Submit same device configuration with MAC address and instrument serial numbers
            yield server
              .post('/device')
              .set('Authorization', secondContext.deviceAuth)
              .send(
                _.merge(secondContext.basicDevicePayload, {
                  configuration: {
                    checkpoint: null,
                    data: {
                      macAddress,
                      country: countryCode,
                      instrumentSerialNumbers,
                    },
                  },
                })
              )

            const firstDeviceApiKeyStatus = yield knex('DeviceApiKey as dak')
              .where({ 'dak.token': firstContext.apiKey })
              .select('dak.deviceId', 'dak.revoked')

            // Check that old API key is no longer associated with a device
            assert.deepEqual(firstDeviceApiKeyStatus, [
              {
                deviceId: null,
                revoked: 1,
              },
            ])

            // Check that device exists with MAC Address and Instrument
            // Serial linked to the new device API key
            const secondDeviceUniqueIdentifiers = yield knex(
              'DeviceApiKey as dak'
            )
              .join('Device as d', 'dak.DeviceId', 'd.id')
              .where({ 'dak.token': secondContext.apiKey })
              .select('d.macAddress', 'd.serial', 'd.id')
            assert.deepEqual(secondDeviceUniqueIdentifiers, [
              {
                macAddress,
                serial: instrumentSerialNumbers.join(),
                id: secondContext.device.id,
              },
            ])
          })

          yield* secondContext.cleanUp()
        }))
    })

    describe('when MAC address changes', () => {
      describe('and device API key changes', () => {
        const firstContext = createGxConnectTestContext(server, {
          countryAbbreviation: countryCode,
          adminUsername,
          adminPassword,
          deviceName,
          macAddress,
          instrumentSerialNumbers,
        })

        before(firstContext.beforeRegisterAndSetDevice)
        after(firstContext.afterCleanUp)

        it('should create a new device', () =>
          firstContext.runTest(function*(knex) {
            // Check that device exists with MAC Address and Instrument Serial
            const firstDeviceUniqueIdentifiers = yield knex(
              'DeviceApiKey as dak'
            )
              .join('Device as d', 'dak.DeviceId', 'd.id')
              .where({ 'dak.token': firstContext.apiKey })
              .select('d.macAddress', 'd.serial')

            assert.deepEqual(firstDeviceUniqueIdentifiers, [
              {
                macAddress,
                serial: instrumentSerialNumbers.join(),
              },
            ])

            // Single device exists, now generate a new API key
            const newMacAddress = 'MAC12345678FAKE'
            const secondContext = createGxConnectTestContext(server, {
              countryAbbreviation: countryCode,
              adminUsername,
              adminPassword,
              deviceName,
              macAddress: newMacAddress,
              instrumentSerialNumbers,
            })

            yield* secondContext.registerAndSetDevice()

            yield* secondContext.runTestInline(function*(knex) {
              assert.notEqual(secondContext.apiKey, firstContext.apiKey)

              const firstDeviceApiKeyStatus = yield knex('DeviceApiKey as dak')
                .where({ 'dak.token': firstContext.apiKey })
                .select('dak.deviceId', 'dak.revoked')

              // Check that old API key still associated with a device and is active
              assert.deepEqual(firstDeviceApiKeyStatus, [
                {
                  deviceId: firstContext.device.id,
                  revoked: 0,
                },
              ])

              // Check that a new device exists with the new MAC Address and Instrument
              // Serial linked to the new device API key
              const secondDeviceUniqueIdentifiers = yield knex(
                'DeviceApiKey as dak'
              )
                .join('Device as d', 'dak.DeviceId', 'd.id')
                .where({ 'dak.token': secondContext.apiKey })
                .select('d.macAddress', 'd.serial', 'd.id', 'dak.revoked')
              assert.deepEqual(secondDeviceUniqueIdentifiers, [
                {
                  macAddress: newMacAddress,
                  serial: instrumentSerialNumbers.join(),
                  id: secondContext.device.id,
                  revoked: 0,
                },
              ])

              // Check that the devices are different (one API key per device
              assert.notEqual(
                secondDeviceUniqueIdentifiers[0].id,
                firstDeviceApiKeyStatus[0].deviceId
              )
            })

            yield* secondContext.cleanUp()
          }))
      })

      describe('but device API key remains the same', () => {
        const context = createGxConnectTestContext(server, {
          countryAbbreviation: countryCode,
          adminUsername,
          adminPassword,
          deviceName,
          macAddress,
          instrumentSerialNumbers,
        })

        before(context.beforeRegisterAndSetDevice)
        const runTest = context.runTest
        after(context.afterCleanUp)

        it('should update the MAC address of the existing device', () =>
          runTest(function*(knex) {
            // Check that device exists with MAC Address and Instrument Serial
            const deviceUniqueIdentifiers = yield knex('DeviceApiKey as dak')
              .join('Device as d', 'dak.DeviceId', 'd.id')
              .where({ 'dak.token': context.apiKey })
              .select('d.macAddress', 'd.serial')

            assert.deepEqual(deviceUniqueIdentifiers, [
              {
                macAddress,
                serial: instrumentSerialNumbers.join(),
              },
            ])

            // Single device exists, now send a new MAC address
            const newMacAddress = 'MAC12345678FAKE'
            yield server
              .post('/device')
              .set('Authorization', context.deviceAuth)
              .send(
                _.merge(context.basicDevicePayload, {
                  configuration: {
                    data: {
                      macAddress: newMacAddress,
                    },
                  },
                })
              )

            // Check that the MAC address has changed
            const newDeviceDetails = yield knex('DeviceApiKey as dak')
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
                  siteName: deviceName,
                  countryCode,
                  deviceType: context.basicDevicePayload.type.id,
                },
              ]
            )

            // Check that there are no orphaned devices with
            // the old MAC address
            const orphanedDevices = yield knex('Device')
              .where({ macAddress })
              .select()

            assert.isEmpty(orphanedDevices)
          }))
      })
    })

    describe('when instrument serial changes', () => {
      describe('and device API key changes', () => {
        const firstContext = createGxConnectTestContext(server, {
          countryAbbreviation: countryCode,
          adminUsername,
          adminPassword,
          deviceName,
          macAddress,
          instrumentSerialNumbers,
        })

        before(firstContext.beforeRegisterAndSetDevice)
        after(firstContext.afterCleanUp)

        it('should create a new device', () =>
          firstContext.runTest(function*(knex) {
            // Check that device exists with MAC Address and Instrument Serial
            const firstDeviceUniqueIdentifiers = yield knex(
              'DeviceApiKey as dak'
            )
              .join('Device as d', 'dak.DeviceId', 'd.id')
              .where({ 'dak.token': firstContext.apiKey })
              .select('d.macAddress', 'd.serial')

            assert.deepEqual(firstDeviceUniqueIdentifiers, [
              {
                macAddress,
                serial: instrumentSerialNumbers.join(),
              },
            ])

            // Single device exists, now generate a new API key
            const newInstrumentSerialNumbers = ['123456', '098765', '456789']
            const secondContext = createGxConnectTestContext(server, {
              countryAbbreviation: countryCode,
              adminUsername,
              adminPassword,
              deviceName,
              macAddress,
              instrumentSerialNumbers: newInstrumentSerialNumbers,
            })

            yield* secondContext.registerAndSetDevice()

            yield* secondContext.runTestInline(function*(knex) {
              assert.notEqual(secondContext.apiKey, firstContext.apiKey)

              const firstDeviceApiKeyStatus = yield knex('DeviceApiKey as dak')
                .where({ 'dak.token': firstContext.apiKey })
                .select('dak.deviceId', 'dak.revoked')

              // Check that old API key still associated with a device and is active
              assert.deepEqual(firstDeviceApiKeyStatus, [
                {
                  deviceId: firstContext.device.id,
                  revoked: 0,
                },
              ])

              // Check that a new device exists with the new MAC Address and Instrument
              // Serial linked to the new device API key
              const secondDeviceUniqueIdentifiers = yield knex(
                'DeviceApiKey as dak'
              )
                .join('Device as d', 'dak.DeviceId', 'd.id')
                .where({ 'dak.token': secondContext.apiKey })
                .select('d.macAddress', 'd.serial', 'd.id', 'dak.revoked')
              assert.deepEqual(secondDeviceUniqueIdentifiers, [
                {
                  macAddress,
                  serial: newInstrumentSerialNumbers.join(),
                  id: secondContext.device.id,
                  revoked: 0,
                },
              ])

              // Check that the devices are different (one API key per device
              assert.notEqual(
                secondDeviceUniqueIdentifiers[0].id,
                firstDeviceApiKeyStatus[0].deviceId
              )
            })

            yield* secondContext.cleanUp()
          }))
      })

      describe('but device API key remains the same', () => {
        const context = createGxConnectTestContext(server, {
          countryAbbreviation: countryCode,
          adminUsername,
          adminPassword,
          deviceName,
          macAddress,
          instrumentSerialNumbers,
        })

        before(context.beforeRegisterAndSetDevice)
        const runTest = context.runTest
        after(context.afterCleanUp)

        it('should update the serial of the existing device', () =>
          runTest(function*(knex) {
            // Check that device exists with MAC Address and Instrument Serial
            const deviceUniqueIdentifiers = yield knex('DeviceApiKey as dak')
              .join('Device as d', 'dak.DeviceId', 'd.id')
              .where({ 'dak.token': context.apiKey })
              .select('d.macAddress', 'd.serial')

            assert.deepEqual(deviceUniqueIdentifiers, [
              {
                macAddress,
                serial: instrumentSerialNumbers.join(),
              },
            ])

            // Single device exists, now send a new instrument serial numbers
            const newInstrumentSerialNumbers = ['654321', '098765']
            yield server
              .post('/device')
              .set('Authorization', context.deviceAuth)
              .send(
                _.merge(context.basicDevicePayload, {
                  configuration: {
                    data: {
                      instrumentSerialNumbers: newInstrumentSerialNumbers,
                    },
                  },
                })
              )

            // Check that the instrument serial has changed
            const newDeviceDetails = yield knex('DeviceApiKey as dak')
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
                  serial: newInstrumentSerialNumbers.join(),
                  siteName: deviceName,
                  countryCode,
                  deviceType: context.basicDevicePayload.type.id,
                },
              ]
            )

            // Check that there are no orphaned devices with
            // the instrument serial numbers
            const orphanedDevices = yield knex('Device')
              .where({ serial: instrumentSerialNumbers.join() })
              .select()

            assert.isEmpty(orphanedDevices)
          }))
      })
    })
  })

  describe('results', () => {
    const basicResultPayload = {
      result: {
        id: 'UNIQUE-RESULT-ID',
        assay: {
          id: 'MtbRifUltra',
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
          ProbeData: {},
          CustomFieldData: {
            '1': {
              NotAvailable: false,
              Label: 'HIV Status',
              Value: 'Unknown',
            },
            '2': {
              NotAvailable: false,
              Label: 'Visual Analysis',
              Value: 'Blood Stained',
            },
          },
        },
      },
    }

    const context = createGxConnectTestContext(server, {
      countryAbbreviation: countryCode,
      adminUsername,
      adminPassword,
      deviceName,
      macAddress,
      instrumentSerialNumbers,
    })
    before(context.beforeRegisterAndSetDevice)
    const runTest = context.runTest
    after(context.afterCleanUp)

    it('should append a result if the external ID is not known', () =>
      runTest(function*(knex) {
        const { basicDevicePayload, deviceAuth, device, site } = context

        const beforeResultDetails = yield* getLastResult(knex, device.id)

        assert.isUndefined(beforeResultDetails)

        yield server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(_.merge(basicDevicePayload, basicResultPayload))
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })
          .catch(assert.fail)

        const afterResultDetails = yield* getLastResult(knex, device.id)
        assert.deepEqual(_.omit(afterResultDetails, 'id'), {
          externalId: basicResultPayload.result.id,
          deviceId: device.id,
          siteId: device.siteId,
          geographyId: site.geographyId,
          assay: basicResultPayload.result.assay.id,
          assayVersion: basicResultPayload.result.assay.version,
          resultWorkflowStatus: 'OK',
          resultSource: 'DiagnosticDevice',
          resultType: 'Patient',
          resultCategory1: 'Success',
          resultCategory2: null,
          sampleId: basicResultPayload.result.sample.id,
          sampleCollectedOn: null,
          sampleOriginSiteId: device.siteId,
          sampleTypeId: null,
          resultData: basicResultPayload.result.data,
          startedOn: null,
          endedOn: null,
          consumableSerial: null,
          consumableExpirationDate: null,
          consumableLot: null,
          instrumentSerial: basicResultPayload.result.instrument.serial,
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
      runTest(function*(knex) {
        const { basicDevicePayload, deviceAuth, device, site } = context

        const beforeResultDetails = yield* getLastResult(knex, device.id)

        assert.isNotEmpty(beforeResultDetails)

        const testStartedOn = setMilliseconds(subDays(context.now, 3), 0)
        const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
        yield server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(_.merge(basicDevicePayload,
            {
              result: _.merge(basicResultPayload.result, {
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

        const afterResultDetails = yield* getLastResult(knex, device.id)
        assert.equal(beforeResultDetails.id, afterResultDetails.id)
        assert.deepEqual(_.omit(afterResultDetails, 'id'), {
          externalId: basicResultPayload.result.id,
          deviceId: device.id,
          siteId: device.siteId,
          geographyId: site.geographyId,
          assay: basicResultPayload.result.assay.id,
          assayVersion: basicResultPayload.result.assay.version,
          resultWorkflowStatus: 'OK',
          resultSource: 'DiagnosticDevice',
          resultType: 'Patient',
          resultCategory1: 'Success',
          resultCategory2: null,
          sampleId: basicResultPayload.result.sample.id,
          sampleCollectedOn: null,
          sampleOriginSiteId: device.siteId,
          sampleTypeId: null,
          resultData: basicResultPayload.result.data,
          startedOn: testStartedOn,
          endedOn: testEndedOn,
          consumableSerial: null,
          consumableExpirationDate: null,
          consumableLot: null,
          instrumentSerial: basicResultPayload.result.instrument.serial,
          moduleName: basicResultPayload.result.instrument.module.name,
          moduleSerial: basicResultPayload.result.instrument.module.serial,
          patientData: basicResultPayload.result.patient,
          senderVersion: basicResultPayload.result.sender.version,
          senderOperator: basicResultPayload.result.sender.operator,
          notes: null,
          errorCode: null,
        })
      }))

    describe('when the assay in the result payload is unknown to Aspect', () => {
      const assayName = 'New Assay Type'
      after(() =>
        run(function*(knex) {
          return yield knex('Assay').where({ externalId: assayName }).delete()
        })
      )

      it('should create an assay', () =>
        runTest(function*(knex) {
          const { basicDevicePayload, deviceAuth, device } = context

          const resultId = 'UNIQUE-ID-NEW-ASSAY'
          const assayVersion = '1'
          const getAssayDetails = function*(assayName) {
            return yield knex('Assay as a')
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
          }
          const newAssayDetailsBefore = yield* getAssayDetails(assayName)
          assert.isUndefined(newAssayDetailsBefore)

          yield server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(_.merge(basicDevicePayload,
              {
                result: _.merge(basicResultPayload.result, {
                  id: resultId,
                  assay: {
                    id: assayName,
                    version: assayVersion,
                  },
                }),
              })
            )
            .then(res => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const resultDetails = yield* getLastResult(knex, device.id)
          assert.equal(resultDetails.externalId, resultId)

          const newAssayDetailsAfter = yield* getAssayDetails(assayName)
          assert.deepEqual(_.omit(newAssayDetailsAfter, 'assayId'), {
            assayName,
            assayExternalId: assayName,
            assayTypeName: 'Unknown',
            deviceTypeExternalId: basicDevicePayload.type.id,
          })

          assert.equal(resultDetails.externalId, resultId)
        }))
    })

    describe('when the assay in the result payload is mapped to a consumable', () => {
      it('should reduce inventory levels of that consumable appropriately', () => {})
    })

    describe('when the result is an instrument error', () => {
      it('should set the workflow status of the result to error', () => {})
    })
  })
})
