const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const addYears = require('date-fns/add_years')
const subDays = require('date-fns/sub_days')
const addHours = require('date-fns/add_hours')
const subHours = require('date-fns/sub_hours')
const addSeconds = require('date-fns/add_seconds')
const setMilliseconds = require('date-fns/set_milliseconds')
const { createGxConnectTestContext } = require('./gxconnect_utils')
const { getLastResultId } = require('../utils')
const {
  resultTextToResultCategoryMapping,
  basicResultPayload,
} = require('./geneXpertConstants')
const { run } = require('../../../src/db')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

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

    describe('when known device API key is specified', () => {
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
            countryAbbreviation: countryCode,
            adminUsername,
            adminPassword,
            deviceName,
            macAddress,
          })

          before(context.beforeRegisterAndSetDevice)
          const { runTest } = context
          after(context.afterCleanUp)

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
        firstContext.runTest(async knex => {
          // Check that device exists with MAC Address and Instrument Serial
          const firstDeviceUniqueIdentifiers = await knex('DeviceApiKey as dak')
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

          await secondContext.registerAndSetDevice()

          await secondContext.runTestInline(async knex => {
            assert.notEqual(secondContext.apiKey, firstContext.apiKey)
            // Submit same device configuration with MAC address and instrument serial numbers
            await server
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

            const firstDeviceApiKeyStatus = await knex('DeviceApiKey as dak')
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
            const secondDeviceUniqueIdentifiers = await knex(
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

          await secondContext.cleanUp()
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
          firstContext.runTest(async knex => {
            // Check that device exists with MAC Address and Instrument Serial
            const firstDeviceUniqueIdentifiers = await knex(
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

            await secondContext.registerAndSetDevice()

            await secondContext.runTestInline(async knex => {
              assert.notEqual(secondContext.apiKey, firstContext.apiKey)

              const firstDeviceApiKeyStatus = await knex('DeviceApiKey as dak')
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
              const secondDeviceUniqueIdentifiers = await knex(
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

            await secondContext.cleanUp()
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
        const { runTest } = context
        after(context.afterCleanUp)

        it('should update the MAC address of the existing device', () =>
          runTest(async knex => {
            // Check that device exists with MAC Address and Instrument Serial
            const deviceUniqueIdentifiers = await knex('DeviceApiKey as dak')
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
            await server
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
            const orphanedDevices = await knex('Device')
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
          firstContext.runTest(async knex => {
            // Check that device exists with MAC Address and Instrument Serial
            const firstDeviceUniqueIdentifiers = await knex(
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

            await secondContext.registerAndSetDevice()

            await secondContext.runTestInline(async knex => {
              assert.notEqual(secondContext.apiKey, firstContext.apiKey)

              const firstDeviceApiKeyStatus = await knex('DeviceApiKey as dak')
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
              const secondDeviceUniqueIdentifiers = await knex(
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

            await secondContext.cleanUp()
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
        const { runTest } = context
        after(context.afterCleanUp)

        it('should update the serial of the existing device', () =>
          runTest(async knex => {
            // Check that device exists with MAC Address and Instrument Serial
            const deviceUniqueIdentifiers = await knex('DeviceApiKey as dak')
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
            await server
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
            const orphanedDevices = await knex('Device')
              .where({ serial: instrumentSerialNumbers.join() })
              .select()

            assert.isEmpty(orphanedDevices)
          }))
      })
    })
  })

  describe('results', () => {
    const context = createGxConnectTestContext(server, {
      countryAbbreviation: countryCode,
      adminUsername,
      adminPassword,
      deviceName,
      macAddress,
      instrumentSerialNumbers,
    })
    before(context.beforeRegisterAndSetDevice)
    const { runTest, getLastResult } = context
    after(context.afterCleanUp)

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

    it('should append a result if the external ID is not known', () =>
      runTest(async () => {
        const { basicDevicePayload, deviceAuth, device, site } = context

        const beforeResultDetails = await getLastResult()

        assert.isUndefined(beforeResultDetails)

        const testStartedOn = setMilliseconds(subDays(context.now, 3), 0)
        await server
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

        const afterResultDetails = await getLastResult()
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
      runTest(async () => {
        const { basicDevicePayload, deviceAuth, device, site } = context

        const beforeResultDetails = await getLastResult()

        assert.isNotEmpty(beforeResultDetails)

        const testStartedOn = setMilliseconds(subDays(context.now, 3), 0)
        await server
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

        const afterResultDetails = await getLastResult()
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
      runTest(async () => {
        const { basicDevicePayload, deviceAuth } = context

        const sendResult = async (
          resultId,
          assay,
          resultText,
          expectedResultCategory1,
          expectedResultCategory2,
          runNumber
        ) => {
          const testStartedOn = setMilliseconds(
            addSeconds(subDays(context.now, 3), runNumber),
            0
          )
          const testEndedOn = setMilliseconds(
            addSeconds(addHours(testStartedOn, 2), runNumber),
            0
          )
          await server
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
                      resultText,
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

          const resultDetails = await getLastResult()

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

          const resultDetails = await getLastResult(knex, device.id)
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
        runTest(async knex => {
          const { basicDevicePayload, deviceAuth, device, site, now } = context

          const consumableAssay = await knex('ConsumableAssay as ca')
            .join('Assay as a', 'ca.assayId', 'a.id')
            .join('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
            .where({ 'dt.externalId': basicDevicePayload.type.id })
            .andWhere('ca.quantity', '>', 0)
            .first('ca.consumableId', 'ca.quantity', 'a.externalId as assayId')

          assert.isNotEmpty(consumableAssay)
          assert.isAbove(consumableAssay.quantity, 0)

          expiryDate = new Date(addYears(now, 1).setHours(0, 0, 0, 0))
          inventoryItemId = await knex('InventoryItem').insert({
            consumableId: consumableAssay.consumableId,
            siteId: site.id,
            expiresOn: expiryDate,
            quantityOnHand: initialQuantityOnHand,
          })

          const testStartedOn = setMilliseconds(subDays(context.now, 3), 0)
          const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
          await server
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

          const lastResultId = await getLastResultId(knex, device.id)
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
              siteId: site.id,
              consumableReason: 'Test Conducted',
              resultId: lastResultId,
              quantity: consumableAssay.quantity,
            },
          ])
        }))

      describe('when the test already exists in the database', () => {
        it('should NOT reduce inventory levels of the consumable', () =>
          runTest(async knex => {
            const { basicDevicePayload, deviceAuth, device, site } = context

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

            let inventoryItem = await knex('InventoryItem')
              .where({ id: inventoryItemId })
              .first()
            assert.equal(
              inventoryItem.quantityOnHand,
              initialQuantityOnHand - consumableAssay.quantity
            )

            const testStartedOn = setMilliseconds(subDays(context.now, 3), 0)
            const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
            await server
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

            const lastResultId = await getLastResultId(knex, device.id)
            inventoryItem = await knex('InventoryItem')
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

          const lastResult = await getLastResult()
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
    const { runTest } = context
    after(context.afterCleanUp)

    it('should create inventory items that do not exist', () =>
      runTest(async knex => {
        const { basicDevicePayload, deviceAuth, site, now } = context
        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: site.id })
          .select()
        assert.isEmpty(inventoryItemsAtSiteBefore)

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const expirationDate = new Date(addYears(now, 1).setHours(0, 0, 0, 0))
        const consumableName = 'Xpert HIV-1 Qual Cartridge'
        const consumableReason = 'Captured'
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
      runTest(async knex => {
        const { basicDevicePayload, deviceAuth, site, now } = context
        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: site.id })
          .select()

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
                      consumableReasonName: 'Captured',
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

        const inventoryItemsAtSiteAfter = await knex('InventoryItem')
          .where({ siteId: site.id })
          .select()
        assert.deepEqual(inventoryItemsAtSiteBefore, inventoryItemsAtSiteAfter)
      }))

    it('should accept all types of GeneXpert cartridges', () =>
      runTest(async knex => {
        const { basicDevicePayload, deviceAuth, site, now } = context

        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: site.id })
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
            _.map(inventoryItemsAtSiteAfter, inventoryItem =>
              _.omit(inventoryItem, 'id')
            ),
            'consumableName'
          ),
          _.sortBy(
            _.map(inventoryChanges, inventoryChange => ({
              consumableName: inventoryChange.consumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: inventoryChange.expirationDate,
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
            'il.adjustedFrom',
            'il.adjustedTo'
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
              expiresOn: inventoryChange.expirationDate,
              quantity: Math.abs(inventoryChange.quantity),
              notes: null,
              adjustedFrom: setMilliseconds(inventoryChange.dateChanged, 0),
              adjustedTo: null,
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
        const consumableReason = 'Captured'
        const quantity = 13

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
                      resultingQuantityOnHand:
                        inventoryItemAtSiteBefore.quantityOnHand + quantity,
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
        const consumableReason = 'Captured'
        const quantity = -3

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
                      resultingQuantityOnHand:
                        inventoryItemAtSiteBefore.quantityOnHand + quantity,
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
      runTest(async knex => {
        const { basicDevicePayload, deviceAuth, site, now } = context

        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: site.id })
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
            _.map(inventoryItemsAtSiteAfter, inventoryItem =>
              _.omit(inventoryItem, 'id')
            ),
            ['consumableName', 'consumableReason', 'expiresOn']
          ),
          _.sortBy(
            _.map(inventoryChanges, inventoryChange => ({
              consumableName: inventoryChange.consumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: inventoryChange.expirationDate,
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
              consumableName: inventoryChange.consumableName,
              siteId: site.id,
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
            })),
            ['consumableName', 'consumableReason', 'expiresOn']
          )
        )
      }))

    it('should identify lots based on expiration date and adjust the quantity of the correct lot', () =>
      runTest(async knex => {
        const { basicDevicePayload, deviceAuth, site, now } = context

        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: site.id })
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
            _.map(inventoryItemsAtSiteAfter, inventoryItem =>
              _.omit(inventoryItem, 'id')
            ),
            'expiresOn'
          ),
          _.sortBy(
            _.map([lot1, lot2], inventoryChange => ({
              consumableName: inventoryChange.consumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: inventoryChange.expirationDate,
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
            'il.adjustedFrom',
            'il.adjustedTo'
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
        assert.deepEqual(
          _.sortBy(inventoryLogsForLot1And2, [
            'consumableName',
            'consumableReason',
            'expiresOn',
          ]),
          _.sortBy(
            [
              {
                consumableName: lot1.consumableName,
                siteId: site.id,
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
                siteId: site.id,
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
                siteId: site.id,
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
                siteId: site.id,
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
            ],
            ['consumableName', 'consumableReason', 'expiresOn']
          )
        )
      }))

    describe('when quantity on hand is explicitly specified in the data', () => {
      it('should overwrite the quantity on hand in the inventory record', () =>
        runTest(async knex => {
          const { basicDevicePayload, deviceAuth, site, now } = context

          const inventoryItemsAtSiteBefore = await knex('InventoryItem')
            .where({ siteId: site.id })
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

          const inventoryItemsAtSiteAfterCapture = await knex(
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
                consumableName: initialLotCaptured.consumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: initialLotCaptured.expirationDate,
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

          const inventoryItemsAtSiteAfterLoss = await knex(
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
                consumableName: inventoryLost.consumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: inventoryLost.expirationDate,
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

          const inventoryItemsAtSiteBefore = await knex('InventoryItem')
            .where({ siteId: site.id })
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

          const inventoryItemsAtSiteAfterCapture = await knex(
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
                consumableName: initialLotCaptured.consumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: initialLotCaptured.expirationDate,
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

          const inventoryItemsAtSiteAfterLoss = await knex(
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
                consumableName: inventoryLost.consumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: inventoryLost.expirationDate,
                quantityOnHand:
                  initialLotCaptured.quantity + inventoryLost.quantity,
              },
            ]
          )
        }))
    })
  })
})
