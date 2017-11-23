const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const subDays = require('date-fns/sub_days')
const addHours = require('date-fns/add_hours')
const addYears = require('date-fns/add_years')
const setMilliseconds = require('date-fns/set_milliseconds')
const {
  createGxConnectTestContext,
  getLastResult,
} = require('./gxconnect_utils')
const { getLastResultId } = require('./utils')
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
          .send(
            _.merge(_.merge(basicDevicePayload, basicResultPayload), {
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

    it('should map result categories based on result text', () =>
      runTest(function*(knex) {
        const { basicDevicePayload, deviceAuth, device } = context

        const resultTextToResultCategoryMapping = {
          'DETECTADO ALTO|DETECTADO|': {
            resultId: '806322_959059_68053af2',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTADO ALTO|NO DETECTADO|': {
            resultId: '808660_856927_c21f22b5',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'DETECTADO ALTO||': {
            resultId: '806297_759939_62aa53c5',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTADO BAIXO|DETECTADO|': {
            resultId: '806296_000000_36b79ac4',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTADO BAIXO||': {
            resultId: '806297_143248_fefcb73a',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTADO BAJO|DETECTADO|': {
            resultId: '808660_516549_5843113c',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTADO BAJO|NO DETECTADO|': {
            resultId: '808660_155158_73a49b5e',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'DETECTADO MEDIO|DETECTADO|': {
            resultId: '808660_240222_32809e47',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTADO MEDIO|NO DETECTADO|': {
            resultId: '808660_245245_ea96d71d',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'DETECTADO MUITO BAIXO|DETECTADO|': {
            resultId: '806296_124131_53dc55df',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTADO MUITO BAIXO|INDETERMINADO|': {
            resultId: '806322_055206_e4da3b7f',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTADO MUY BAJO|DETECTADO|': {
            resultId: '808660_732759_e45d844e',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTADO MUY BAJO|NO DETECTADO|': {
            resultId: '808660_056222_890bbbbf',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'DETECTED HIGH|DETECTED|': {
            resultId: '703926_534519_80a43866',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTED HIGH|NOT DETECTED|': {
            resultId: '805204_507448_71ae59d7',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'DETECTED HIGH||': {
            resultId: '806315_233435_85d8ce59',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTED LOW|DETECTED|': {
            resultId: '805204_258307_e10886fc',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTED LOW|NOT DETECTED|': {
            resultId: '805204_511443_47c1ec95',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'DETECTED LOW||': {
            resultId: '806611_616843_1534b76d',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTED MEDIUM|DETECTED|': {
            resultId: '703926_656626_767c9e0d',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTED MEDIUM|INDETERMINATE|': {
            resultId: '816097_956643_6ee11f74',
            assay: 'MtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTED MEDIUM|NOT DETECTED|': {
            resultId: '805204_323333_7c4b3433',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'DETECTED MEDIUM||': {
            resultId: '806588_916211_8f121ce0',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTED VERY LOW|DETECTED|': {
            resultId: '703926_751717_9caa47e2',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTED VERY LOW|INDETERMINATE|': {
            resultId: '805204_756803_be92a39c',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTED VERY LOW|NOT DETECTED|': {
            resultId: '805204_527454_9aec1b81',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'DETECTED VERY LOW||': {
            resultId: '807414_342358_fe131d7f',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTED|DETECTED|': {
            resultId: '807407_248750_de319d6d',
            assay: 'Ebola',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTED|NOT DETECTED|': {
            resultId: '806273_111453_85f20b56',
            assay: 'Ebola',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'Ebola GP DETECTED|Ebola NP DETECTED|': {
            resultId: '807407_109552_b3a77ce1',
            assay: 'Ebola',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'Ebola GP DETECTED|Ebola NP NOT DETECTED|': {
            resultId: '703865_948556_701af6e0',
            assay: 'Ebola',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'Ebola GP DÉTECTÉ|Ebola NP DÉTECTÉ|': {
            resultId: '806264_203624_68931f0d',
            assay: 'Ebola',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'Ebola GP DÉTECTÉ|Ebola NP NON DÉTECTÉ|': {
            resultId: '807399_808247_18064d61',
            assay: 'Ebola',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'Ebola GP NON DÉTECTÉ|Ebola NP DÉTECTÉ|': {
            resultId: '806264_255710_9f44e956',
            assay: 'Ebola',
            resultCategory1: 'NotDetected',
            resultCategory2: 'Detected',
          },
          'Ebola GP NON DÉTECTÉ|Ebola NP NON DÉTECTÉ|': {
            resultId: '806268_919439_a13ee062',
            assay: 'Ebola',
            resultCategory1: 'NotDetected',
            resultCategory2: 'NotDetected',
          },
          'Ebola GP NOT DETECTED|Ebola NP DETECTED|': {
            resultId: '807407_058538_385f2208',
            assay: 'Ebola',
            resultCategory1: 'NotDetected',
            resultCategory2: 'Detected',
          },
          'Ebola GP NOT DETECTED|Ebola NP NOT DETECTED|': {
            resultId: '807407_425919_7b869dcb',
            assay: 'Ebola',
            resultCategory1: 'NotDetected',
            resultCategory2: 'NotDetected',
          },
          ERROR: {
            resultId: '803385_000000_36366388',
            assay: 'MtbRif',
            resultCategory1: 'Error',
            resultCategory2: 'Error',
          },
          'ERROR |ERROR': {
            resultId: '708118_000000_08fe2621',
            assay: 'MtbRif',
            resultCategory1: 'Error',
            resultCategory2: 'Error',
          },
          'ERROR|ERROR|': {
            resultId: '707450_055201_d6821077',
            assay: 'MtbRif',
            resultCategory1: 'Error',
            resultCategory2: 'Error',
          },
          INVALID: {
            resultId: '803385_600600_1534b76d',
            assay: 'MtbRif',
            resultCategory1: 'Invalid',
            resultCategory2: 'Invalid',
          },
          'INVALID |INVALID': {
            resultId: '708118_000000_6cfe0e61',
            assay: 'MtbRif',
            resultCategory1: 'Invalid',
            resultCategory2: 'Invalid',
          },
          'INVALID |Rif Resistance NOT DETECTED': {
            resultId: '803384_000000_e2231217',
            assay: 'MtbRif',
            resultCategory1: 'Invalid',
            resultCategory2: 'NotDetected',
          },
          'INVALID|INVALID|': {
            resultId: '707552_739812_885a5631',
            assay: 'MtbRif',
            resultCategory1: 'Invalid',
            resultCategory2: 'Invalid',
          },
          'MTB DETECTADO ALTO|Rif Resistance  NÃO DETECTADO': {
            resultId: '806319_001249_aa2495a5',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO ALTO|Rif Resistance  NÃO DETECTADO|': {
            resultId: '806305_536531_be68c4e3',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO ALTO|Rif Resistance DETECTADO': {
            resultId: '808368_731124_02585cab',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTADO ALTO|Rif Resistance DETECTADO|': {
            resultId: '806297_047253_17200fde',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTADO ALTO|Rif Resistance NÃO DETECTADO': {
            resultId: '808368_431526_e452361b',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO ALTO|Rif Resistance NÃO DETECTADO|': {
            resultId: '808340_418521_19facee1',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO BAIXO|Rif Resistance  NÃO DETECTADO': {
            resultId: '806319_625816_6eef0ceb',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO BAIXO|Rif Resistance  NÃO DETECTADO|': {
            resultId: '806305_502547_1180112a',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO BAIXO|Rif Resistance DETECTADO': {
            resultId: '806319_338607_fda3fcc8',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTADO BAIXO|Rif Resistance DETECTADO|': {
            resultId: '806297_610801_f14425e5',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTADO BAIXO|Rif Resistance NÃO DETECTADO': {
            resultId: '808368_605645_9a55b59b',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO BAIXO|Rif Resistance NÃO DETECTADO|': {
            resultId: '808340_258425_5465282b',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO MÉDIO|Rif Resistance  NÃO DETECTADO': {
            resultId: '806319_934112_c9f27581',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO MÉDIO|Rif Resistance  NÃO DETECTADO|': {
            resultId: '806305_955003_236d42bb',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO MÉDIO|Rif Resistance DETECTADO': {
            resultId: '808368_437807_4a538081',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTADO MÉDIO|Rif Resistance DETECTADO|': {
            resultId: '806297_153338_5cc415b5',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTADO MÉDIO|Rif Resistance NÃO DETECTADO': {
            resultId: '808368_221311_4516b681',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO MÉDIO|Rif Resistance NÃO DETECTADO|': {
            resultId: '808339_426541_f4dd765c',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO MUITO BAIXO|Rif Resistance  NÃO DETECTADO': {
            resultId: '806319_309445_e89373aa',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO MUITO BAIXO|Rif Resistance  NÃO DETECTADO|': {
            resultId: '806305_127208_2281af10',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO MUITO BAIXO|Rif Resistance DETECTADO': {
            resultId: '806319_043301_0f726482',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTADO MUITO BAIXO|Rif Resistance DETECTADO|': {
            resultId: '806297_004120_b0222ba0',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTADO MUITO BAIXO|Rif Resistance INDETERMINADO': {
            resultId: '806319_746013_1de6ec80',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTADO MUITO BAIXO|Rif Resistance INDETERMINADO|': {
            resultId: '806323_109246_b913384a',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTADO MUITO BAIXO|Rif Resistance NÃO DETECTADO': {
            resultId: '808368_337500_ffc213c4',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO MUITO BAIXO|Rif Resistance NÃO DETECTADO|': {
            resultId: '808340_330450_2f590e7a',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DÉTECTÉ BAS|Rif Resistance DÉTECTÉ|': {
            resultId: '806264_104232_ae2bac2e',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DÉTECTÉ BAS|Rif Resistance NON DÉTECTÉ|': {
            resultId: '808904_959254_86985e10',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DÉTECTÉ ÉLEVÉ|Rif Resistance DÉTECTÉ|': {
            resultId: '809246_453701_c4ca4238',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DÉTECTÉ ÉLEVÉ|Rif Resistance NON DÉTECTÉ|': {
            resultId: '809246_456644_1f0da6c3',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DÉTECTÉ MOYEN|Rif Resistance DÉTECTÉ|': {
            resultId: '809240_354406_1721d657',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DÉTECTÉ MOYEN|Rif Resistance NON DÉTECTÉ|': {
            resultId: '809246_013209_93dd4de5',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DÉTECTÉ TRÈS BAS|Rif Resistance DÉTECTÉ|': {
            resultId: '806264_014112_926abae8',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DÉTECTÉ TRÈS BAS|Rif Resistance NON DÉTECTÉ|': {
            resultId: '809246_126317_e3796ae8',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED': {
            resultId: '803385_800800_8e296a06',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTED HIGH|Rif Resistance DETECTED': {
            resultId: '803896_128250_68ce199e',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED HIGH|Rif Resistance DETECTED|': {
            resultId: '707420_356435_17d70124',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED HIGH|Rif Resistance INDETERMINATE': {
            resultId: '803384_000000_4d5b9953',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTED HIGH|Rif Resistance NOT DETECTED': {
            resultId: '803896_825203_d9556810',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED HIGH|Rif Resistance NOT DETECTED|': {
            resultId: '707420_413508_46951588',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED HIGH||RIF Resistance DETECTED': {
            resultId: '706164_531205_381c7c34',
            assay: 'MtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED HIGH||RIF Resistance NOT DETECTED': {
            resultId: '816097_156913_5506995a',
            assay: 'MtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED LOW|Rif Resistance DETECTED': {
            resultId: '803896_410606_4e822038',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED LOW|Rif Resistance DETECTED|': {
            resultId: '707420_230417_11b14739',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED LOW|Rif Resistance NOT DETECTED': {
            resultId: '803896_533808_9e94b15e',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED LOW|Rif Resistance NOT DETECTED|': {
            resultId: '707420_136143_2e0f158d',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED LOW||': {
            resultId: '801599_818054_cb172839',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTED LOW||RIF Resistance NOT DETECTED': {
            resultId: '816120_842542_47d46bea',
            assay: 'MtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED MEDIUM|Rif Resistance DETECTED': {
            resultId: '803896_501833_b5375aab',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED MEDIUM|Rif Resistance DETECTED|': {
            resultId: '707420_328344_786c82b7',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED MEDIUM|Rif Resistance NOT DETECTED': {
            resultId: '803896_643814_877a9ba7',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED MEDIUM|Rif Resistance NOT DETECTED|': {
            resultId: '707420_435526_4b360dac',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED MEDIUM||': {
            resultId: '707393_832012_30bf6efd',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTED MEDIUM||RIF Resistance DETECTED': {
            resultId: '816096_819513_6ca15977',
            assay: 'MtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED MEDIUM||RIF Resistance NOT DETECTED': {
            resultId: '816101_713437_2a34229c',
            assay: 'MtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED VERY LOW|ERROR': {
            resultId: '803384_000000_4588e674',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Error',
          },
          'MTB DETECTED VERY LOW|NA|': {
            resultId: '708171_123123_cb4371bc',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTED VERY LOW|Rif Resistance DETECTED': {
            resultId: '801337_221331_2ba59664',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED VERY LOW|Rif Resistance DETECTED|': {
            resultId: '707420_239334_e71e3691',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED VERY LOW|Rif Resistance INDETERMINATE': {
            resultId: '803896_302420_ff2f2d7a',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTED VERY LOW|Rif Resistance INDETERMINATE|': {
            resultId: '708169_237436_7ca61ea5',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTED VERY LOW|Rif Resistance NOT DETECTED': {
            resultId: '803896_546643_642b4e98',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED VERY LOW|Rif Resistance NOT DETECTED|': {
            resultId: '707420_216330_7bd7300c',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED VERY LOW||RIF Resistance INDETERMINATE': {
            resultId: '816096_411048_b2be1867',
            assay: 'MtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTED VERY LOW||RIF Resistance NOT DETECTED': {
            resultId: '816097_427124_6777ebf5',
            assay: 'MtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED |Rif Resistance DETECTED': {
            resultId: '801454_000000_a0b83c02',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB Trace DETECTED|RIF Resistance INDETERMINATE': {
            resultId: '816097_934455_be664213',
            assay: 'MtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB ОБНАРУЖЕН ВЫСОКИЙ|Rif Resistance НЕ ОБНАРУЖЕН': {
            resultId: '707408_201221_c1d5447a',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB ОБНАРУЖЕН ВЫСОКИЙ|Rif Resistance НЕ ОБНАРУЖЕН|': {
            resultId: '707408_723912_e1988abb',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB ОБНАРУЖЕН ВЫСОКИЙ|Rif Resistance ОБНАРУЖЕН': {
            resultId: '802080_419555_5add3ecb',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB ОБНАРУЖЕН ВЫСОКИЙ|Rif Resistance ОБНАРУЖЕН|': {
            resultId: '707408_441550_e1d4b23f',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB ОБНАРУЖЕН НИЗКИЙ|Rif Resistance НЕ ОБНАРУЖЕН': {
            resultId: '802080_628728_c19148d9',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB ОБНАРУЖЕН НИЗКИЙ|Rif Resistance НЕ ОБНАРУЖЕН|': {
            resultId: '707408_116137_7bff5937',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB ОБНАРУЖЕН НИЗКИЙ|Rif Resistance ОБНАРУЖЕН': {
            resultId: '802080_425605_647f2fc1',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB ОБНАРУЖЕН НИЗКИЙ|Rif Resistance ОБНАРУЖЕН|': {
            resultId: '707408_021030_4db34f30',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance НЕ ОБНАРУЖЕН': {
            resultId: '802080_312419_ca47c86d',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance НЕ ОБНАРУЖЕН|': {
            resultId: '707408_454600_256d5fb0',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance НЕОПРЕДЕЛЕННЫЙ': {
            resultId: '802065_932010_53829080',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance НЕОПРЕДЕЛЕННЫЙ|': {
            resultId: '707408_422543_a61773ec',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance ОБНАРУЖЕН': {
            resultId: '802065_432543_1013bc87',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance ОБНАРУЖЕН|': {
            resultId: '707408_022034_d3d2d98b',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB ОБНАРУЖЕН СРЕДНИЙ|Rif Resistance НЕ ОБНАРУЖЕН': {
            resultId: '707408_247315_c9e091ae',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB ОБНАРУЖЕН СРЕДНИЙ|Rif Resistance НЕ ОБНАРУЖЕН|': {
            resultId: '707408_917034_3586cae7',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB ОБНАРУЖЕН СРЕДНИЙ|Rif Resistance ОБНАРУЖЕН': {
            resultId: '802080_303442_bc45d516',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB ОБНАРУЖЕН СРЕДНИЙ|Rif Resistance ОБНАРУЖЕН|': {
            resultId: '707408_556554_344281f7',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'NO RESULT|NO RESULT|': {
            resultId: '806404_013050_f659bb72',
            assay: 'Ebola',
            resultCategory1: 'NoResult',
            resultCategory2: 'NoResult',
          },
          'NOT DETECTED|DETECTED|': {
            resultId: '807407_058538_385f2208',
            assay: 'Ebola',
            resultCategory1: 'NotDetected',
            resultCategory2: 'Detected',
          },
          'NOT DETECTED|NOT DETECTED|': {
            resultId: '807407_417905_66059375',
            assay: 'Ebola',
            resultCategory1: 'NotDetected',
            resultCategory2: 'NotDetected',
          },
          'null null|ERROR': {
            resultId: '803384_000000_d282ef26',
            assay: 'MtbRif',
            resultCategory1: 'Success',
            resultCategory2: 'Error',
          },
          'null null|INVALID': {
            resultId: '803384_000000_7940ab47',
            assay: 'MtbRif',
            resultCategory1: 'Success',
            resultCategory2: 'Invalid',
          },
          'null null|Rif Resistance INDETERMINATE': {
            resultId: '803384_000000_4c22bd44',
            assay: 'MtbRif',
            resultCategory1: 'Success',
            resultCategory2: 'Indeterminate',
          },
          'null null|Rif Resistance NOT DETECTED': {
            resultId: '803384_000000_996009f2',
            assay: 'MtbRif',
            resultCategory1: 'Success',
            resultCategory2: 'NotDetected',
          },
          'Trace DETECTED|INDETERMINATE|': {
            resultId: '812438_034539_70686262',
            assay: 'MtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          '|MTB Trace DETECTED|RIF Resistance INDETERMINATE': {
            resultId: '816097_516033_4ca9cda7',
            assay: 'MtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
        }
        const sendResult = function*(
          resultId,
          assay,
          resultText,
          expectedResultCategory1,
          expectedResultCategory2
        ) {
          yield server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.merge(_.merge(basicDevicePayload, basicResultPayload), {
                result: _.merge(basicResultPayload.result, {
                  id: resultId,
                  assay: _.merge(basicResultPayload.result.assay, {
                    id: assay,
                  }),
                  data: _.merge(basicResultPayload.result.data, {
                    ResultText: resultText,
                  }),
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
          assert.equal(
            resultDetails.resultCategory1,
            expectedResultCategory1,
            `Result 1 in ${resultText}`
          )
          assert.equal(
            resultDetails.resultCategory2,
            expectedResultCategory2,
            `Result 2 in ${resultText}`
          )
        }

        for (const resultText in resultTextToResultCategoryMapping) {
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
            yield* sendResult(
              resultId,
              assay,
              resultText,
              resultCategory1,
              resultCategory2
            )
          }
        }
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
            .send(
              _.merge(_.merge(basicDevicePayload, basicResultPayload), {
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
      const deductInventoryTestResultId = 'UNIQUE-ID-TEST-DEDUCT-INVENTORY'
      const initialQuantityOnHand = 100
      let expiryDate
      let inventoryItemId

      it('should reduce inventory levels of that consumable appropriately', () =>
        runTest(function*(knex) {
          const { basicDevicePayload, deviceAuth, device, site, now } = context

          const consumableAssay = yield knex('ConsumableAssay as ca')
            .join('Assay as a', 'ca.assayId', 'a.id')
            .join('deviceType as dt', 'a.deviceTypeId', 'dt.id')
            .where({ 'dt.externalId': basicDevicePayload.type.id })
            .andWhere('ca.quantity', '>', 0)
            .first('ca.consumableId', 'ca.quantity', 'a.externalId as assayId')

          assert.isNotEmpty(consumableAssay)
          assert.isAbove(consumableAssay.quantity, 0)

          expiryDate = setMilliseconds(addYears(now, 1), 0)
          inventoryItemId = yield knex('InventoryItem').insert({
            consumableId: consumableAssay.consumableId,
            siteId: site.id,
            expiresOn: expiryDate,
            quantityOnHand: initialQuantityOnHand,
          })

          yield server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.merge(_.merge(basicDevicePayload, basicResultPayload), {
                result: _.merge(basicResultPayload.result, {
                  id: deductInventoryTestResultId,
                  assay: {
                    id: consumableAssay.assayId,
                    version: '2',
                  },
                }),
              })
            )
            .then(res => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const lastResultId = yield* getLastResultId(knex, device.id)
          const inventoryItem = yield knex('InventoryItem')
            .where({ id: inventoryItemId })
            .first()
          assert.equal(
            inventoryItem.quantityOnHand,
            initialQuantityOnHand - consumableAssay.quantity
          )

          const inventoryLogs = yield knex('InventoryLog as il')
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
              siteId: site.id,
              consumableReason: 'Test Conducted',
              resultId: lastResultId,
              quantity: -consumableAssay.quantity,
            },
          ])
        }))

      describe('when the test already exists in the database', () => {
        it('should NOT reduce inventory levels of the consumable', () =>
          runTest(function*(knex) {
            const { basicDevicePayload, deviceAuth, device, site } = context

            const consumableAssay = yield knex('ConsumableAssay as ca')
              .join('Assay as a', 'ca.assayId', 'a.id')
              .join('deviceType as dt', 'a.deviceTypeId', 'dt.id')
              .where({ 'dt.externalId': basicDevicePayload.type.id })
              .andWhere('ca.quantity', '>', 0)
              .first(
                'ca.consumableId',
                'ca.quantity',
                'a.externalId as assayId'
              )

            assert.isNotEmpty(consumableAssay)
            assert.isAbove(consumableAssay.quantity, 0)

            let inventoryItem = yield knex('InventoryItem')
              .where({ id: inventoryItemId })
              .first()
            assert.equal(
              inventoryItem.quantityOnHand,
              initialQuantityOnHand - consumableAssay.quantity
            )

            const testStartedOn = setMilliseconds(subDays(context.now, 3), 0)
            const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
            yield server
              .post('/device')
              .set('Authorization', deviceAuth)
              .send(
                _.merge(_.merge(basicDevicePayload, basicResultPayload), {
                  result: _.merge(basicResultPayload.result, {
                    id: deductInventoryTestResultId,
                    assay: {
                      id: consumableAssay.assayId,
                      version: '2',
                    },
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

            const lastResultId = yield* getLastResultId(knex, device.id)
            inventoryItem = yield knex('InventoryItem')
              .where({
                consumableId: consumableAssay.consumableId,
                siteId: site.id,
                expiresOn: expiryDate,
              })
              .first()

            assert.equal(inventoryItem.id, inventoryItemId)
            assert.equal(
              inventoryItem.quantityOnHand,
              initialQuantityOnHand - consumableAssay.quantity
            )

            const inventoryLogs = yield knex('InventoryLog as il')
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
                siteId: site.id,
                consumableReason: 'Test Conducted',
                resultId: lastResultId,
                quantity: -consumableAssay.quantity,
              },
            ])
          }))
      })
    })

    describe('when the result is an instrument error', () => {
      it('should set the workflow status of the result to error', () => {})
    })
  })
})
