const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const addYears = require('date-fns/add_years')
const subDays = require('date-fns/sub_days')
const addHours = require('date-fns/add_hours')
const subHours = require('date-fns/sub_hours')
const addSeconds = require('date-fns/add_seconds')
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
                _.assign({}, secondContext.basicDevicePayload, {
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
                _.assign({}, context.basicDevicePayload, {
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
                _.assign({}, context.basicDevicePayload, {
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

    it('should reject a result without a start or end date date', () =>
      runTest(function*(knex) {
        const { basicDevicePayload, deviceAuth, device } = context

        const beforeResultDetails = yield* getLastResult(knex, device.id)

        assert.isUndefined(beforeResultDetails)

        yield server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(_.assign({}, basicDevicePayload, basicResultPayload))
          .then(res => {
            assert.equal(res.status, 400)
          })
          .catch(assert.fail)

        const afterResultDetails = yield* getLastResult(knex, device.id)
        assert.isUndefined(afterResultDetails)
      }))

    it('should append a result if the external ID is not known', () =>
      runTest(function*(knex) {
        const { basicDevicePayload, deviceAuth, device, site } = context

        const beforeResultDetails = yield* getLastResult(knex, device.id)

        assert.isUndefined(beforeResultDetails)

        const testStartedOn = setMilliseconds(subDays(context.now, 3), 0)
        yield server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(
            _.assign({}, _.assign({}, basicDevicePayload, basicResultPayload), {
              result: _.assign({}, basicResultPayload.result, {
                sample: { id: 'new sample' },
                instrument: { serial: 'new instrument' },
                startedOn: testStartedOn,
              }),
            })
          )
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })
          .catch(assert.fail)

        const afterResultDetails = yield* getLastResult(knex, device.id)
        assert.deepEqual(_.omit(afterResultDetails, 'id', 'externalId'), {
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
          instrumentSerial: 'new instrument',
          moduleName: null,
          moduleSerial: null,
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
        yield server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(
            _.assign({}, _.assign({}, basicDevicePayload, basicResultPayload), {
              result: _.assign({}, basicResultPayload.result, {
                sample: { id: 'new sample' },
                instrument: { serial: 'new instrument' },
                startedOn: testStartedOn,
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
        assert.deepEqual(_.omit(afterResultDetails, 'id', 'externalId'), {
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
          instrumentSerial: 'new instrument',
          moduleName: null,
          moduleSerial: null,
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
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTADO ALTO|NO DETECTADO|': {
            resultId: '808660_856927_c21f22b5',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'DETECTADO ALTO||': {
            resultId: '806297_759939_62aa53c5',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTADO BAIXO|DETECTADO|': {
            resultId: '806296_000000_36b79ac4',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTADO BAIXO||': {
            resultId: '806297_143248_fefcb73a',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTADO BAJO|DETECTADO|': {
            resultId: '808660_516549_5843113c',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTADO BAJO|NO DETECTADO|': {
            resultId: '808660_155158_73a49b5e',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'DETECTADO MEDIO|DETECTADO|': {
            resultId: '808660_240222_32809e47',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTADO MEDIO|NO DETECTADO|': {
            resultId: '808660_245245_ea96d71d',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'DETECTADO MUITO BAIXO|DETECTADO|': {
            resultId: '806296_124131_53dc55df',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTADO MUITO BAIXO|INDETERMINADO|': {
            resultId: '806322_055206_e4da3b7f',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTADO MUY BAJO|DETECTADO|': {
            resultId: '808660_732759_e45d844e',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTADO MUY BAJO|NO DETECTADO|': {
            resultId: '808660_056222_890bbbbf',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'DETECTED HIGH|DETECTED|': {
            resultId: '703926_534519_80a43866',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTED HIGH|NOT DETECTED|': {
            resultId: '805204_507448_71ae59d7',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'DETECTED HIGH||': {
            resultId: '806315_233435_85d8ce59',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTED LOW|DETECTED|': {
            resultId: '805204_258307_e10886fc',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTED LOW|NOT DETECTED|': {
            resultId: '805204_511443_47c1ec95',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'DETECTED LOW||': {
            resultId: '806611_616843_1534b76d',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTED MEDIUM|DETECTED|': {
            resultId: '703926_656626_767c9e0d',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTED MEDIUM|INDETERMINATE|': {
            resultId: '816097_956643_6ee11f74',
            assay: 'GxMtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTED MEDIUM|NOT DETECTED|': {
            resultId: '805204_323333_7c4b3433',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'DETECTED MEDIUM||': {
            resultId: '806588_916211_8f121ce0',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTED VERY LOW|DETECTED|': {
            resultId: '703926_751717_9caa47e2',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTED VERY LOW|INDETERMINATE|': {
            resultId: '805204_756803_be92a39c',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTED VERY LOW|NOT DETECTED|': {
            resultId: '805204_527454_9aec1b81',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'DETECTED VERY LOW||': {
            resultId: '807414_342358_fe131d7f',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'DETECTED|DETECTED|': {
            resultId: '807407_248750_de319d6d',
            assay: 'GxEbola',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'DETECTED|NOT DETECTED|': {
            resultId: '806273_111453_85f20b56',
            assay: 'GxEbola',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'Ebola GP DETECTED|Ebola NP DETECTED|': {
            resultId: '807407_109552_b3a77ce1',
            assay: 'GxEbola',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'Ebola GP DETECTED|Ebola NP NOT DETECTED|': {
            resultId: '703865_948556_701af6e0',
            assay: 'GxEbola',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'Ebola GP DÉTECTÉ|Ebola NP DÉTECTÉ|': {
            resultId: '806264_203624_68931f0d',
            assay: 'GxEbola',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'Ebola GP DÉTECTÉ|Ebola NP NON DÉTECTÉ|': {
            resultId: '807399_808247_18064d61',
            assay: 'GxEbola',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'Ebola GP NON DÉTECTÉ|Ebola NP DÉTECTÉ|': {
            resultId: '806264_255710_9f44e956',
            assay: 'GxEbola',
            resultCategory1: 'NotDetected',
            resultCategory2: 'Detected',
          },
          'Ebola GP NON DÉTECTÉ|Ebola NP NON DÉTECTÉ|': {
            resultId: '806268_919439_a13ee062',
            assay: 'GxEbola',
            resultCategory1: 'NotDetected',
            resultCategory2: 'NotDetected',
          },
          'Ebola GP NOT DETECTED|Ebola NP DETECTED|': {
            resultId: '807407_058538_385f2208',
            assay: 'GxEbola',
            resultCategory1: 'NotDetected',
            resultCategory2: 'Detected',
          },
          'Ebola GP NOT DETECTED|Ebola NP NOT DETECTED|': {
            resultId: '807407_425919_7b869dcb',
            assay: 'GxEbola',
            resultCategory1: 'NotDetected',
            resultCategory2: 'NotDetected',
          },
          ERROR: {
            resultId: '803385_000000_36366388',
            assay: 'GxMtbRif',
            resultCategory1: 'Error',
            resultCategory2: 'Error',
          },
          'ERROR |ERROR': {
            resultId: '708118_000000_08fe2621',
            assay: 'GxMtbRif',
            resultCategory1: 'Error',
            resultCategory2: 'Error',
          },
          'ERROR|ERROR|': {
            resultId: '707450_055201_d6821077',
            assay: 'GxMtbRif',
            resultCategory1: 'Error',
            resultCategory2: 'Error',
          },
          INVALID: {
            resultId: '803385_600600_1534b76d',
            assay: 'GxMtbRif',
            resultCategory1: 'Invalid',
            resultCategory2: 'Invalid',
          },
          'INVALID |INVALID': {
            resultId: '708118_000000_6cfe0e61',
            assay: 'GxMtbRif',
            resultCategory1: 'Invalid',
            resultCategory2: 'Invalid',
          },
          'INVALID |Rif Resistance NOT DETECTED': {
            resultId: '803384_000000_e2231217',
            assay: 'GxMtbRif',
            resultCategory1: 'Invalid',
            resultCategory2: 'NotDetected',
          },
          'INVALID|INVALID|': {
            resultId: '707552_739812_885a5631',
            assay: 'GxMtbRif',
            resultCategory1: 'Invalid',
            resultCategory2: 'Invalid',
          },
          'MTB DETECTADO ALTO|Rif Resistance  NÃO DETECTADO': {
            resultId: '806319_001249_aa2495a5',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO ALTO|Rif Resistance  NÃO DETECTADO|': {
            resultId: '806305_536531_be68c4e3',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO ALTO|Rif Resistance DETECTADO': {
            resultId: '808368_731124_02585cab',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTADO ALTO|Rif Resistance DETECTADO|': {
            resultId: '806297_047253_17200fde',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTADO ALTO|Rif Resistance NÃO DETECTADO': {
            resultId: '808368_431526_e452361b',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO ALTO|Rif Resistance NÃO DETECTADO|': {
            resultId: '808340_418521_19facee1',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO BAIXO|Rif Resistance  NÃO DETECTADO': {
            resultId: '806319_625816_6eef0ceb',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO BAIXO|Rif Resistance  NÃO DETECTADO|': {
            resultId: '806305_502547_1180112a',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO BAIXO|Rif Resistance DETECTADO': {
            resultId: '806319_338607_fda3fcc8',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTADO BAIXO|Rif Resistance DETECTADO|': {
            resultId: '806297_610801_f14425e5',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTADO BAIXO|Rif Resistance NÃO DETECTADO': {
            resultId: '808368_605645_9a55b59b',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO BAIXO|Rif Resistance NÃO DETECTADO|': {
            resultId: '808340_258425_5465282b',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO MÉDIO|Rif Resistance  NÃO DETECTADO': {
            resultId: '806319_934112_c9f27581',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO MÉDIO|Rif Resistance  NÃO DETECTADO|': {
            resultId: '806305_955003_236d42bb',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO MÉDIO|Rif Resistance DETECTADO': {
            resultId: '808368_437807_4a538081',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTADO MÉDIO|Rif Resistance DETECTADO|': {
            resultId: '806297_153338_5cc415b5',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTADO MÉDIO|Rif Resistance NÃO DETECTADO': {
            resultId: '808368_221311_4516b681',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO MÉDIO|Rif Resistance NÃO DETECTADO|': {
            resultId: '808339_426541_f4dd765c',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO MUITO BAIXO|Rif Resistance  NÃO DETECTADO': {
            resultId: '806319_309445_e89373aa',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO MUITO BAIXO|Rif Resistance  NÃO DETECTADO|': {
            resultId: '806305_127208_2281af10',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO MUITO BAIXO|Rif Resistance DETECTADO': {
            resultId: '806319_043301_0f726482',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTADO MUITO BAIXO|Rif Resistance DETECTADO|': {
            resultId: '806297_004120_b0222ba0',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTADO MUITO BAIXO|Rif Resistance INDETERMINADO': {
            resultId: '806319_746013_1de6ec80',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTADO MUITO BAIXO|Rif Resistance INDETERMINADO|': {
            resultId: '806323_109246_b913384a',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTADO MUITO BAIXO|Rif Resistance NÃO DETECTADO': {
            resultId: '808368_337500_ffc213c4',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTADO MUITO BAIXO|Rif Resistance NÃO DETECTADO|': {
            resultId: '808340_330450_2f590e7a',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DÉTECTÉ BAS|Rif Resistance DÉTECTÉ|': {
            resultId: '806264_104232_ae2bac2e',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DÉTECTÉ BAS|Rif Resistance NON DÉTECTÉ|': {
            resultId: '808904_959254_86985e10',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DÉTECTÉ ÉLEVÉ|Rif Resistance DÉTECTÉ|': {
            resultId: '809246_453701_c4ca4238',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DÉTECTÉ ÉLEVÉ|Rif Resistance NON DÉTECTÉ|': {
            resultId: '809246_456644_1f0da6c3',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DÉTECTÉ MOYEN|Rif Resistance DÉTECTÉ|': {
            resultId: '809240_354406_1721d657',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DÉTECTÉ MOYEN|Rif Resistance NON DÉTECTÉ|': {
            resultId: '809246_013209_93dd4de5',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DÉTECTÉ TRÈS BAS|Rif Resistance DÉTECTÉ|': {
            resultId: '806264_014112_926abae8',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DÉTECTÉ TRÈS BAS|Rif Resistance NON DÉTECTÉ|': {
            resultId: '809246_126317_e3796ae8',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED': {
            resultId: '803385_800800_8e296a06',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTED HIGH|Rif Resistance DETECTED': {
            resultId: '803896_128250_68ce199e',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED HIGH|Rif Resistance DETECTED|': {
            resultId: '707420_356435_17d70124',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED HIGH|Rif Resistance INDETERMINATE': {
            resultId: '803384_000000_4d5b9953',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTED HIGH|Rif Resistance NOT DETECTED': {
            resultId: '803896_825203_d9556810',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED HIGH|Rif Resistance NOT DETECTED|': {
            resultId: '707420_413508_46951588',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED HIGH||RIF Resistance DETECTED': {
            resultId: '706164_531205_381c7c34',
            assay: 'GxMtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED HIGH||RIF Resistance NOT DETECTED': {
            resultId: '816097_156913_5506995a',
            assay: 'GxMtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED LOW|Rif Resistance DETECTED': {
            resultId: '803896_410606_4e822038',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED LOW|Rif Resistance DETECTED|': {
            resultId: '707420_230417_11b14739',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED LOW|Rif Resistance NOT DETECTED': {
            resultId: '803896_533808_9e94b15e',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED LOW|Rif Resistance NOT DETECTED|': {
            resultId: '707420_136143_2e0f158d',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED LOW||': {
            resultId: '801599_818054_cb172839',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTED LOW||RIF Resistance NOT DETECTED': {
            resultId: '816120_842542_47d46bea',
            assay: 'GxMtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED MEDIUM|Rif Resistance DETECTED': {
            resultId: '803896_501833_b5375aab',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED MEDIUM|Rif Resistance DETECTED|': {
            resultId: '707420_328344_786c82b7',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED MEDIUM|Rif Resistance NOT DETECTED': {
            resultId: '803896_643814_877a9ba7',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED MEDIUM|Rif Resistance NOT DETECTED|': {
            resultId: '707420_435526_4b360dac',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED MEDIUM||': {
            resultId: '707393_832012_30bf6efd',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTED MEDIUM||RIF Resistance DETECTED': {
            resultId: '816096_819513_6ca15977',
            assay: 'GxMtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED MEDIUM||RIF Resistance NOT DETECTED': {
            resultId: '816101_713437_2a34229c',
            assay: 'GxMtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED VERY LOW|ERROR': {
            resultId: '803384_000000_4588e674',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Error',
          },
          'MTB DETECTED VERY LOW|NA|': {
            resultId: '708171_123123_cb4371bc',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTED VERY LOW|Rif Resistance DETECTED': {
            resultId: '801337_221331_2ba59664',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED VERY LOW|Rif Resistance DETECTED|': {
            resultId: '707420_239334_e71e3691',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB DETECTED VERY LOW|Rif Resistance INDETERMINATE': {
            resultId: '803896_302420_ff2f2d7a',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTED VERY LOW|Rif Resistance INDETERMINATE|': {
            resultId: '708169_237436_7ca61ea5',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTED VERY LOW|Rif Resistance NOT DETECTED': {
            resultId: '803896_546643_642b4e98',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED VERY LOW|Rif Resistance NOT DETECTED|': {
            resultId: '707420_216330_7bd7300c',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED VERY LOW||RIF Resistance INDETERMINATE': {
            resultId: '816096_411048_b2be1867',
            assay: 'GxMtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB DETECTED VERY LOW||RIF Resistance NOT DETECTED': {
            resultId: '816097_427124_6777ebf5',
            assay: 'GxMtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB DETECTED |Rif Resistance DETECTED': {
            resultId: '801454_000000_a0b83c02',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB Trace DETECTED|RIF Resistance INDETERMINATE': {
            resultId: '816097_934455_be664213',
            assay: 'GxMtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB ОБНАРУЖЕН ВЫСОКИЙ|Rif Resistance НЕ ОБНАРУЖЕН': {
            resultId: '707408_201221_c1d5447a',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB ОБНАРУЖЕН ВЫСОКИЙ|Rif Resistance НЕ ОБНАРУЖЕН|': {
            resultId: '707408_723912_e1988abb',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB ОБНАРУЖЕН ВЫСОКИЙ|Rif Resistance ОБНАРУЖЕН': {
            resultId: '802080_419555_5add3ecb',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB ОБНАРУЖЕН ВЫСОКИЙ|Rif Resistance ОБНАРУЖЕН|': {
            resultId: '707408_441550_e1d4b23f',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB ОБНАРУЖЕН НИЗКИЙ|Rif Resistance НЕ ОБНАРУЖЕН': {
            resultId: '802080_628728_c19148d9',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB ОБНАРУЖЕН НИЗКИЙ|Rif Resistance НЕ ОБНАРУЖЕН|': {
            resultId: '707408_116137_7bff5937',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB ОБНАРУЖЕН НИЗКИЙ|Rif Resistance ОБНАРУЖЕН': {
            resultId: '802080_425605_647f2fc1',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB ОБНАРУЖЕН НИЗКИЙ|Rif Resistance ОБНАРУЖЕН|': {
            resultId: '707408_021030_4db34f30',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance НЕ ОБНАРУЖЕН': {
            resultId: '802080_312419_ca47c86d',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance НЕ ОБНАРУЖЕН|': {
            resultId: '707408_454600_256d5fb0',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance НЕОПРЕДЕЛЕННЫЙ': {
            resultId: '802065_932010_53829080',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance НЕОПРЕДЕЛЕННЫЙ|': {
            resultId: '707408_422543_a61773ec',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance ОБНАРУЖЕН': {
            resultId: '802065_432543_1013bc87',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB ОБНАРУЖЕН ОЧЕНЬ НИЗКИЙ|Rif Resistance ОБНАРУЖЕН|': {
            resultId: '707408_022034_d3d2d98b',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB ОБНАРУЖЕН СРЕДНИЙ|Rif Resistance НЕ ОБНАРУЖЕН': {
            resultId: '707408_247315_c9e091ae',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB ОБНАРУЖЕН СРЕДНИЙ|Rif Resistance НЕ ОБНАРУЖЕН|': {
            resultId: '707408_917034_3586cae7',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'NotDetected',
          },
          'MTB ОБНАРУЖЕН СРЕДНИЙ|Rif Resistance ОБНАРУЖЕН': {
            resultId: '802080_303442_bc45d516',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'MTB ОБНАРУЖЕН СРЕДНИЙ|Rif Resistance ОБНАРУЖЕН|': {
            resultId: '707408_556554_344281f7',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Detected',
          },
          'NO RESULT|NO RESULT|': {
            resultId: '806404_013050_f659bb72',
            assay: 'GxEbola',
            resultCategory1: 'NoResult',
            resultCategory2: 'NoResult',
          },
          'NOT DETECTED|DETECTED|': {
            resultId: '807407_058538_385f2208',
            assay: 'GxEbola',
            resultCategory1: 'NotDetected',
            resultCategory2: 'Detected',
          },
          'NOT DETECTED|NOT DETECTED|': {
            resultId: '807407_417905_66059375',
            assay: 'GxEbola',
            resultCategory1: 'NotDetected',
            resultCategory2: 'NotDetected',
          },
          'null null|ERROR': {
            resultId: '803384_000000_d282ef26',
            assay: 'GxMtbRif',
            resultCategory1: 'Success',
            resultCategory2: 'Error',
          },
          'null null|INVALID': {
            resultId: '803384_000000_7940ab47',
            assay: 'GxMtbRif',
            resultCategory1: 'Success',
            resultCategory2: 'Invalid',
          },
          'null null|Rif Resistance INDETERMINATE': {
            resultId: '803384_000000_4c22bd44',
            assay: 'GxMtbRif',
            resultCategory1: 'Success',
            resultCategory2: 'Indeterminate',
          },
          'null null|Rif Resistance NOT DETECTED': {
            resultId: '803384_000000_996009f2',
            assay: 'GxMtbRif',
            resultCategory1: 'Success',
            resultCategory2: 'NotDetected',
          },
          'Trace DETECTED|INDETERMINATE|': {
            resultId: '812438_034539_70686262',
            assay: 'GxMtbRif',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
          '|MTB Trace DETECTED|RIF Resistance INDETERMINATE': {
            resultId: '816097_516033_4ca9cda7',
            assay: 'GxMtbRifUltra',
            resultCategory1: 'Detected',
            resultCategory2: 'Indeterminate',
          },
        }
        const sendResult = function*(
          resultId,
          assay,
          resultText,
          expectedResultCategory1,
          expectedResultCategory2,
          runNumber
        ) {
          const testStartedOn = setMilliseconds(
            addSeconds(subDays(context.now, 3), runNumber),
            0
          )
          const testEndedOn = setMilliseconds(
            addSeconds(addHours(testStartedOn, 2), runNumber),
            0
          )
          yield server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign(
                {},
                _.assign({}, basicDevicePayload, basicResultPayload),
                {
                  result: _.assign({}, basicResultPayload.result, {
                    id: resultId,
                    startedOn: testStartedOn,
                    endedOn: testEndedOn,
                    assay: _.assign({}, basicResultPayload.result.assay, {
                      id: assay,
                    }),
                    data: _.assign({}, basicResultPayload.result.data, {
                      ResultText: resultText,
                    }),
                  }),
                }
              )
            )
            .then(res => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const resultDetails = yield* getLastResult(knex, device.id)

          assert.equal(resultDetails.resultData.geneXpertTestId, resultId)
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

        let runNumber = 1
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
              resultCategory2,
              runNumber
            )
            runNumber += 1
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

      it('should set the result to assay GxUnknown', () =>
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

          const testStartedOn = setMilliseconds(subDays(context.now, 3), 0)
          yield server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign(
                {},
                _.assign({}, basicDevicePayload, basicResultPayload),
                {
                  result: _.assign({}, basicResultPayload.result, {
                    id: resultId,
                    startedOn: testStartedOn,
                    assay: {
                      id: assayName,
                      version: assayVersion,
                    },
                  }),
                }
              )
            )
            .then(res => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const resultDetails = yield* getLastResult(knex, device.id)
          assert.equal(resultDetails.resultData.geneXpertTestId, resultId)
          assert.equal(resultDetails.assay, 'GxUnknown')
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

          const testStartedOn = setMilliseconds(subDays(context.now, 3), 0)
          const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
          yield server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign(
                {},
                _.assign({}, basicDevicePayload, basicResultPayload),
                {
                  result: _.assign({}, basicResultPayload.result, {
                    id: deductInventoryTestResultId,
                    startedOn: testStartedOn,
                    endedOn: testEndedOn,
                    sample: { id: 'Existing Sample' },
                    instrument: { serial: 'Existing Instrument' },
                    assay: {
                      id: consumableAssay.assayId,
                      version: '2',
                    },
                  }),
                }
              )
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
              quantity: consumableAssay.quantity,
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
                _.assign(
                  {},
                  _.assign({}, basicDevicePayload, basicResultPayload),
                  {
                    result: _.assign({}, basicResultPayload.result, {
                      id: deductInventoryTestResultId,
                      assay: {
                        id: consumableAssay.assayId,
                        version: '2',
                      },
                      sample: { id: 'Existing Sample' },
                      instrument: { serial: 'Existing Instrument' },
                      startedOn: testStartedOn,
                      endedOn: testEndedOn,
                    }),
                  }
                )
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
                quantity: consumableAssay.quantity,
              },
            ])
          }))
      })
    })

    describe('when an error code has been specified in the result payload', () => {
      it('should set the workflow status of the result to error', () =>
        runTest(function*(knex) {
          const { basicDevicePayload, deviceAuth, device } = context

          const errorTestResultId = 'UNIQUE-ID-WITH-ERROR-RESULT'
          const errorCode = '12345'

          const testStartedOn = setMilliseconds(subDays(context.now, 3), 0)
          const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
          yield server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign(
                {},
                _.assign({}, basicDevicePayload, basicResultPayload),
                {
                  result: _.assign({}, basicResultPayload.result, {
                    id: errorTestResultId,
                    startedOn: testStartedOn,
                    endedOn: testEndedOn,
                    error: {
                      code: errorCode,
                    },
                  }),
                }
              )
            )
            .then(res => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const lastResult = yield* getLastResult(knex, device.id)
          assert.deepEqual(
            _.pick(
              lastResult,
              'errorCode',
              'resultCategory1',
              'resultWorkflowStatus'
            ),
            {
              errorCode,
              resultCategory1: 'Error',
              resultWorkflowStatus: 'Error',
            }
          )
          assert.equal(lastResult.resultData.geneXpertTestId, errorTestResultId)
        }))
    })
  })

  describe('inventory changes', () => {
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

    it('should create inventory items that do not exist', () =>
      runTest(function*(knex) {
        const { basicDevicePayload, deviceAuth, site, now } = context
        const inventoryItemsAtSiteBefore = yield knex('InventoryItem')
          .where({ siteId: site.id })
          .select()
        assert.isEmpty(inventoryItemsAtSiteBefore)

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const expirationDate = setMilliseconds(addYears(now, 1), 0)
        const consumableName = 'Xpert HIV-1 Qual Cartridge'
        const consumableReason = 'Captured'
        const initialQuantity = 100
        const quantity = 5

        yield server
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
                      ConsumableName: consumableName,
                      ConsumableReasonName: consumableReason,
                      Quantity: quantity,
                      ResultingQuantityOnHand: initialQuantity + quantity,
                      DateChanged: startedOn,
                      ExpirationDate: expirationDate,
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

        const inventoryItemsAtSiteAfter = yield knex('InventoryItem as ii')
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
          _.map(inventoryItemsAtSiteAfter, inventoryItem =>
            _.omit(inventoryItem, 'id')
          ),
          [
            {
              consumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: expirationDate,
              quantityOnHand: initialQuantity + quantity,
            },
          ]
        )

        const inventoryLog = yield knex('InventoryLog as il')
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
            siteId: site.id,
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

    it('should ignore changes for consumables that are unknown', () =>
      runTest(function*(knex) {
        const { basicDevicePayload, deviceAuth, site, now } = context
        const inventoryItemsAtSiteBefore = yield knex('InventoryItem')
          .where({ siteId: site.id })
          .select()

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const expirationDate = setMilliseconds(addYears(now, 1), 0)

        yield server
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
                      ConsumableName: 'Unknown consumable type',
                      ConsumableReasonName: 'Captured',
                      Quantity: 12,
                      ResultingQuantityOnHand: 112,
                      DateChanged: startedOn,
                      ExpirationDate: expirationDate,
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

        const inventoryItemsAtSiteAfter = yield knex('InventoryItem')
          .where({ siteId: site.id })
          .select()
        assert.deepEqual(inventoryItemsAtSiteBefore, inventoryItemsAtSiteAfter)
      }))

    it('should accept all types of GeneXpert cartridges', () =>
      runTest(function*(knex) {
        const { basicDevicePayload, deviceAuth, site, now } = context

        const inventoryItemsAtSiteBefore = yield knex('InventoryItem')
          .where({ siteId: site.id })
          .pluck('id')

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const consumableReason = 'Captured'

        const inventoryChanges = [
          {
            ConsumableName: 'GeneXpert TB Cartridge',
            ConsumableReasonName: consumableReason,
            Quantity: 13,
            ResultingQuantityOnHand: 86,
            DateChanged: addHours(startedOn, 1),
            ExpirationDate: setMilliseconds(subDays(addYears(now, 1), 1), 0),
          },
          {
            ConsumableName: 'GeneXpert Ebola Cartridge',
            ConsumableReasonName: consumableReason,
            Quantity: 3,
            ResultingQuantityOnHand: 21,
            DateChanged: addHours(startedOn, 2),
            ExpirationDate: setMilliseconds(subDays(addYears(now, 1), 3), 0),
          },
          {
            ConsumableName: 'Xpert HIV-1 Qual Cartridge',
            ConsumableReasonName: consumableReason,
            Quantity: 44,
            ResultingQuantityOnHand: 50,
            DateChanged: addHours(startedOn, 3),
            ExpirationDate: setMilliseconds(subDays(addYears(now, 1), 3), 0),
          },
          {
            ConsumableName: 'Xpert HIV-1 Viral Load Cartridge',
            ConsumableReasonName: consumableReason,
            Quantity: 1,
            ResultingQuantityOnHand: 13,
            DateChanged: addHours(startedOn, 4),
            ExpirationDate: setMilliseconds(subDays(addYears(now, 1), 4), 0),
          },
          {
            ConsumableName: 'GeneXpert TB Ultra Cartridge',
            ConsumableReasonName: consumableReason,
            Quantity: 26,
            ResultingQuantityOnHand: 41,
            DateChanged: addHours(startedOn, 5),
            ExpirationDate: setMilliseconds(subDays(addYears(now, 1), 8), 0),
          },
        ]

        yield server
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

        const inventoryItemsAtSiteAfter = yield knex('InventoryItem as ii')
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
            _.map(inventoryItemsAtSiteAfter, inventoryItem =>
              _.omit(inventoryItem, 'id')
            ),
            'consumableName'
          ),
          _.sortBy(
            _.map(inventoryChanges, inventoryChange => ({
              consumableName: inventoryChange.ConsumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: inventoryChange.ExpirationDate,
              quantityOnHand: inventoryChange.ResultingQuantityOnHand,
            })),
            'consumableName'
          )
        )

        const inventoryLog = yield knex('InventoryLog as il')
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

        assert.deepEqual(
          _.sortBy(inventoryLog, ['consumableName', 'consumableReason']),
          _.sortBy(
            _.map(inventoryChanges, inventoryChange => ({
              consumableName: inventoryChange.ConsumableName,
              siteId: site.id,
              consumableReason,
              resultId: null,
              operation: 'add from GxConnect',
              lotNumber: null,
              expiresOn: inventoryChange.ExpirationDate,
              quantity: Math.abs(inventoryChange.Quantity),
              notes: null,
              adjustedFrom: setMilliseconds(inventoryChange.DateChanged, 0),
              adjustedTo: null,
            })),
            ['consumableName', 'consumableReason']
          )
        )
      }))

    it('should increase the quantity inventory items that do exist', () =>
      runTest(function*(knex) {
        const { basicDevicePayload, deviceAuth, site, now } = context
        const inventoryItemAtSiteBefore = yield knex('InventoryItem as ii')
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
        const consumableReason = 'Captured'
        const quantity = 13

        yield server
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
                      ConsumableName: inventoryItemAtSiteBefore.consumableName,
                      ConsumableReasonName: consumableReason,
                      Quantity: quantity,
                      ResultingQuantityOnHand:
                        inventoryItemAtSiteBefore.quantityOnHand + quantity,
                      DateChanged: startedOn,
                      ExpirationDate: inventoryItemAtSiteBefore.expiresOn,
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

        const inventoryItemsAtSiteAfter = yield knex('InventoryItem as ii')
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
          _.map(inventoryItemsAtSiteAfter, inventoryItem =>
            _.omit(inventoryItem, 'id')
          ),
          [
            {
              consumableName: inventoryItemAtSiteBefore.consumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: inventoryItemAtSiteBefore.expiresOn,
              quantityOnHand:
                inventoryItemAtSiteBefore.quantityOnHand + quantity,
            },
          ]
        )

        const inventoryLog = yield knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .join('Consumable as c', 'il.consumableId', 'c.id')
          .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
          .orderBy(['il.createdOn', 'il.id'], 'desc')
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
          adjustedFrom: setMilliseconds(startedOn, 0),
          adjustedTo: null,
        })
      }))

    it('should decrease the quantity on hand of existing inventory items', () =>
      runTest(function*(knex) {
        const { basicDevicePayload, deviceAuth, site, now } = context
        const inventoryItemAtSiteBefore = yield knex('InventoryItem as ii')
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
        const consumableReason = 'Captured'
        const quantity = -3

        yield server
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
                      ConsumableName: inventoryItemAtSiteBefore.consumableName,
                      ConsumableReasonName: consumableReason,
                      Quantity: quantity,
                      ResultingQuantityOnHand:
                        inventoryItemAtSiteBefore.quantityOnHand + quantity,
                      DateChanged: startedOn,
                      ExpirationDate: inventoryItemAtSiteBefore.expiresOn,
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

        const inventoryItemsAtSiteAfter = yield knex('InventoryItem as ii')
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
          _.map(inventoryItemsAtSiteAfter, inventoryItem =>
            _.omit(inventoryItem, 'id')
          ),
          [
            {
              consumableName: inventoryItemAtSiteBefore.consumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: inventoryItemAtSiteBefore.expiresOn,
              quantityOnHand:
                inventoryItemAtSiteBefore.quantityOnHand + quantity,
            },
          ]
        )

        const inventoryLog = yield knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .join('Consumable as c', 'il.consumableId', 'c.id')
          .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
          .orderBy(['il.createdOn', 'il.id'], 'desc')
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

        assert.deepEqual(inventoryLog, {
          consumableName: inventoryItemAtSiteBefore.consumableName,
          siteId: site.id,
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
      runTest(function*(knex) {
        const { basicDevicePayload, deviceAuth, site, now } = context

        const inventoryItemsAtSiteBefore = yield knex('InventoryItem')
          .where({ siteId: site.id })
          .pluck('id')

        const startedOn = subDays(now, 1)
        const endedOn = addHours(startedOn, 2)

        const inventoryChanges = [
          {
            ConsumableName: 'GeneXpert TB Cartridge',
            ConsumableReasonName: 'Captured',
            Quantity: 13,
            ResultingQuantityOnHand: 73,
            DateChanged: subHours(startedOn, 1),
            ExpirationDate: setMilliseconds(subDays(addYears(now, 1), 5), 0),
          },
          {
            ConsumableName: 'GeneXpert Ebola Cartridge',
            ConsumableReasonName: 'Captured',
            Quantity: -3,
            ResultingQuantityOnHand: 18,
            DateChanged: subHours(startedOn, 2),
            ExpirationDate: setMilliseconds(subDays(addYears(now, 1), 6), 0),
          },
          {
            ConsumableName: 'Xpert HIV-1 Qual Cartridge',
            ConsumableReasonName: 'Transfer Sent',
            Quantity: -4,
            ResultingQuantityOnHand: 46,
            DateChanged: subHours(startedOn, 3),
            ExpirationDate: setMilliseconds(subDays(addYears(now, 1), 8), 0),
          },
          {
            ConsumableName: 'Xpert HIV-1 Viral Load Cartridge',
            ConsumableReasonName: 'Transfer Received',
            Quantity: 11,
            ResultingQuantityOnHand: 24,
            DateChanged: subHours(startedOn, 4),
            ExpirationDate: setMilliseconds(subDays(addYears(now, 1), 3), 0),
          },
          {
            ConsumableName: 'GeneXpert TB Ultra Cartridge',
            ConsumableReasonName: 'Lost',
            Quantity: -6,
            ResultingQuantityOnHand: 30,
            DateChanged: subHours(startedOn, 5),
            ExpirationDate: setMilliseconds(subDays(addYears(now, 1), 7), 0),
          },
          {
            ConsumableName: 'GeneXpert TB Cartridge',
            ConsumableReasonName: 'Expired',
            Quantity: -6,
            ResultingQuantityOnHand: 50,
            DateChanged: subHours(startedOn, 6),
            ExpirationDate: setMilliseconds(subDays(addYears(now, 1), 2), 0),
          },
        ]

        yield server
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

        const inventoryItemsAtSiteAfter = yield knex('InventoryItem as ii')
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
            _.map(inventoryItemsAtSiteAfter, inventoryItem =>
              _.omit(inventoryItem, 'id')
            ),
            ['consumableName', 'consumableReason', 'expiresOn']
          ),
          _.sortBy(
            _.map(inventoryChanges, inventoryChange => ({
              consumableName: inventoryChange.ConsumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: inventoryChange.ExpirationDate,
              quantityOnHand: inventoryChange.ResultingQuantityOnHand,
            })),
            ['consumableName', 'consumableReason', 'expiresOn']
          )
        )

        const inventoryLog = yield knex('InventoryLog as il')
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

        assert.deepEqual(
          _.sortBy(inventoryLog, [
            'consumableName',
            'consumableReason',
            'expiresOn',
          ]),
          _.sortBy(
            _.map(inventoryChanges, inventoryChange => ({
              consumableName: inventoryChange.ConsumableName,
              siteId: site.id,
              consumableReason: inventoryChange.ConsumableReasonName,
              resultId: null,
              operation:
                inventoryChange.Quantity >= 0
                  ? 'add from GxConnect'
                  : 'remove from GxConnect',
              lotNumber: null,
              expiresOn: inventoryChange.ExpirationDate,
              quantity: Math.abs(inventoryChange.Quantity),
              notes: null,
              adjustedFrom: setMilliseconds(inventoryChange.DateChanged, 0),
              adjustedTo: null,
            })),
            ['consumableName', 'consumableReason', 'expiresOn']
          )
        )
      }))

    it('should accept identify lots based on expiration date and adjust the quantity of the correct lot', () =>
      runTest(function*(knex) {
        const { basicDevicePayload, deviceAuth, site, now } = context

        const inventoryItemsAtSiteBefore = yield knex('InventoryItem')
          .where({ siteId: site.id })
          .pluck('id')

        const startedOn = subDays(now, 5)
        const endedOn = addHours(startedOn, 2)

        const lot1 = {
          ConsumableName: 'GeneXpert TB Cartridge',
          ConsumableReasonName: 'Captured',
          Quantity: 73,
          ResultingQuantityOnHand: 73,
          DateChanged: subHours(startedOn, 2),
          ExpirationDate: setMilliseconds(subDays(addYears(now, 1), 21), 0),
        }
        const lot2 = {
          ConsumableName: 'GeneXpert TB Cartridge',
          ConsumableReasonName: 'Captured',
          Quantity: 38,
          ResultingQuantityOnHand: 38,
          DateChanged: subHours(startedOn, 2),
          ExpirationDate: setMilliseconds(subDays(addYears(now, 1), 33), 0),
        }

        yield server
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

        const inventoryItemsAtSiteAfter = yield knex('InventoryItem as ii')
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
            _.map(inventoryItemsAtSiteAfter, inventoryItem =>
              _.omit(inventoryItem, 'id')
            ),
            'expiresOn'
          ),
          _.sortBy(
            _.map([lot1, lot2], inventoryChange => ({
              consumableName: inventoryChange.ConsumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: inventoryChange.ExpirationDate,
              quantityOnHand: inventoryChange.ResultingQuantityOnHand,
            })),
            'expiresOn'
          )
        )

        const inventoryLogs = yield knex('InventoryLog as il')
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

        assert.deepEqual(
          _.sortBy(
            _.map(inventoryLogs, inventoryLog => _.omit(inventoryLog, 'id')),
            ['consumableName', 'consumableReason']
          ),
          _.sortBy(
            _.map([lot1, lot2], inventoryChange => ({
              consumableName: inventoryChange.ConsumableName,
              siteId: site.id,
              consumableReason: inventoryChange.ConsumableReasonName,
              resultId: null,
              operation:
                inventoryChange.Quantity >= 0
                  ? 'add from GxConnect'
                  : 'remove from GxConnect',
              lotNumber: null,
              expiresOn: inventoryChange.ExpirationDate,
              quantity: Math.abs(inventoryChange.Quantity),
              notes: null,
              adjustedFrom: setMilliseconds(inventoryChange.DateChanged, 0),
              adjustedTo: null,
            })),
            ['consumableName', 'consumableReason']
          )
        )

        const updateToLot1 = _.assign({}, lot1, {
          ConsumableReasonName: 'Stolen',
          Quantity: -3,
          ResultingQuantityOnHand: 70,
          DateChanged: subHours(startedOn, 1),
        })

        yield server
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
          expiresOn: lot1.ExpirationDate,
        })
        const lot2InventoryItem = _.find(inventoryItemsAtSiteAfter, {
          expiresOn: lot2.ExpirationDate,
        })
        const lot1InventoryItemAfterAdjustment1 = yield knex(
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
        const lot2InventoryItemAfterAdjustment1 = yield knex(
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
          consumableName: lot1.ConsumableName,
          inTransitFromSiteId: null,
          lotNumber: null,
          expiresOn: lot1.ExpirationDate,
          quantityOnHand:
            lot1InventoryItem.quantityOnHand + updateToLot1.Quantity,
        })
        assert.deepEqual(lot2InventoryItemAfterAdjustment1, {
          consumableName: lot2.ConsumableName,
          inTransitFromSiteId: null,
          lotNumber: null,
          expiresOn: lot2.ExpirationDate,
          quantityOnHand: lot2.ResultingQuantityOnHand,
        })

        const updateToLot2 = _.assign({}, lot2, {
          ConsumableReasonName: 'Transfer Received',
          Quantity: 100,
          ResultingQuantityOnHand: 138,
          DateChanged: subHours(startedOn, 1),
        })

        yield server
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

        const lot1InventoryItemAfterAdjustment2 = yield knex(
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
        const lot2InventoryItemAfterAdjustment2 = yield knex(
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
          consumableName: lot1.ConsumableName,
          inTransitFromSiteId: null,
          lotNumber: null,
          expiresOn: lot1.ExpirationDate,
          quantityOnHand:
            lot1InventoryItem.quantityOnHand + updateToLot1.Quantity,
        })
        assert.deepEqual(lot2InventoryItemAfterAdjustment2, {
          consumableName: lot2.ConsumableName,
          inTransitFromSiteId: null,
          lotNumber: null,
          expiresOn: lot2.ExpirationDate,
          quantityOnHand:
            lot2InventoryItem.quantityOnHand + updateToLot2.Quantity,
        })
        const inventoryLogsForLot1And2 = yield knex('InventoryLog as il')
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
        assert.deepEqual(inventoryLogsForLot1And2, [
          {
            consumableName: lot1.ConsumableName,
            siteId: site.id,
            consumableReason: lot1.ConsumableReasonName,
            resultId: null,
            operation: 'add from GxConnect',
            lotNumber: null,
            expiresOn: lot1.ExpirationDate,
            quantity: Math.abs(lot1.ResultingQuantityOnHand),
            notes: null,
            adjustedFrom: setMilliseconds(lot1.DateChanged, 0),
            adjustedTo: null,
          },
          {
            consumableName: lot2.ConsumableName,
            siteId: site.id,
            consumableReason: lot2.ConsumableReasonName,
            resultId: null,
            operation: 'add from GxConnect',
            lotNumber: null,
            expiresOn: lot2.ExpirationDate,
            quantity: Math.abs(lot2.ResultingQuantityOnHand),
            notes: null,
            adjustedFrom: setMilliseconds(lot2.DateChanged, 0),
            adjustedTo: null,
          },
          {
            consumableName: lot1.ConsumableName,
            siteId: site.id,
            consumableReason: updateToLot1.ConsumableReasonName,
            resultId: null,
            operation: 'remove from GxConnect',
            lotNumber: null,
            expiresOn: lot1.ExpirationDate,
            quantity: Math.abs(updateToLot1.Quantity),
            notes: null,
            adjustedFrom: setMilliseconds(updateToLot1.DateChanged, 0),
            adjustedTo: null,
          },
          {
            consumableName: lot2.ConsumableName,
            siteId: site.id,
            consumableReason: updateToLot2.ConsumableReasonName,
            resultId: null,
            operation: 'add from GxConnect',
            lotNumber: null,
            expiresOn: lot2.ExpirationDate,
            quantity: Math.abs(updateToLot2.Quantity),
            notes: null,
            adjustedFrom: setMilliseconds(updateToLot2.DateChanged, 0),
            adjustedTo: null,
          },
        ])
      }))

    describe('when quantity on hand is explicitly specified in the data', () => {
      it('should overwrite the quantity on hand in the inventory record', () =>
        runTest(function*(knex) {
          const { basicDevicePayload, deviceAuth, site, now } = context

          const inventoryItemsAtSiteBefore = yield knex('InventoryItem')
            .where({ siteId: site.id })
            .pluck('id')

          const startedOn = subDays(now, 7)
          const endedOn = addHours(startedOn, 2)
          const expirationDate = setMilliseconds(
            subDays(addYears(now, 1), 16),
            0
          )

          const initialLotCaptured = {
            ConsumableName: 'GeneXpert TB Cartridge',
            ConsumableReasonName: 'Captured',
            Quantity: 25,
            ResultingQuantityOnHand: 25,
            DateChanged: subHours(startedOn, 2),
            ExpirationDate: expirationDate,
          }

          yield server
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

          const inventoryItemsAtSiteAfterCapture = yield knex(
            'InventoryItem as ii'
          )
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
              _.map(inventoryItemsAtSiteAfterCapture, inventoryItem =>
                _.omit(inventoryItem, 'id')
              ),
              'expiresOn'
            ),
            [
              {
                consumableName: initialLotCaptured.ConsumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: initialLotCaptured.ExpirationDate,
                quantityOnHand: initialLotCaptured.ResultingQuantityOnHand,
              },
            ]
          )

          const inventoryLost = {
            ConsumableName: 'GeneXpert TB Cartridge',
            ConsumableReasonName: 'Lost',
            Quantity: -5,
            ResultingQuantityOnHand: 999,
            DateChanged: subHours(startedOn, 1),
            ExpirationDate: expirationDate,
          }

          yield server
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

          const inventoryItemsAtSiteAfterLoss = yield knex(
            'InventoryItem as ii'
          )
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
              _.map(inventoryItemsAtSiteAfterLoss, inventoryItem =>
                _.omit(inventoryItem, 'id')
              ),
              'expiresOn'
            ),
            [
              {
                consumableName: inventoryLost.ConsumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: inventoryLost.ExpirationDate,
                quantityOnHand: inventoryLost.ResultingQuantityOnHand,
              },
            ]
          )
        }))
    })

    describe('when quantity on hand is not specified in the data', () => {
      it('should calculate the quantity on hand in the inventory record', () =>
        runTest(function*(knex) {
          const { basicDevicePayload, deviceAuth, site, now } = context

          const inventoryItemsAtSiteBefore = yield knex('InventoryItem')
            .where({ siteId: site.id })
            .pluck('id')

          const startedOn = subDays(now, 9)
          const endedOn = addHours(startedOn, 2)
          const expirationDate = setMilliseconds(
            subDays(addYears(now, 1), 15),
            0
          )

          const initialLotCaptured = {
            ConsumableName: 'GeneXpert TB Cartridge',
            ConsumableReasonName: 'Captured',
            Quantity: 25,
            DateChanged: subHours(startedOn, 2),
            ExpirationDate: expirationDate,
          }

          yield server
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

          const inventoryItemsAtSiteAfterCapture = yield knex(
            'InventoryItem as ii'
          )
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
              _.map(inventoryItemsAtSiteAfterCapture, inventoryItem =>
                _.omit(inventoryItem, 'id')
              ),
              'expiresOn'
            ),
            [
              {
                consumableName: initialLotCaptured.ConsumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: initialLotCaptured.ExpirationDate,
                quantityOnHand: initialLotCaptured.Quantity,
              },
            ]
          )

          const inventoryLost = {
            ConsumableName: 'GeneXpert TB Cartridge',
            ConsumableReasonName: 'Lost',
            Quantity: -5,
            DateChanged: subHours(startedOn, 1),
            ExpirationDate: expirationDate,
          }

          yield server
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

          const inventoryItemsAtSiteAfterLoss = yield knex(
            'InventoryItem as ii'
          )
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
              _.map(inventoryItemsAtSiteAfterLoss, inventoryItem =>
                _.omit(inventoryItem, 'id')
              ),
              'expiresOn'
            ),
            [
              {
                consumableName: inventoryLost.ConsumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: inventoryLost.ExpirationDate,
                quantityOnHand:
                  initialLotCaptured.Quantity + inventoryLost.Quantity,
              },
            ]
          )
        }))
    })
  })
})
