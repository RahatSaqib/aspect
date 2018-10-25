const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const subDays = require('date-fns/sub_days')
const subHours = require('date-fns/sub_hours')
const subMinutes = require('date-fns/sub_minutes')
const setMilliseconds = require('date-fns/set_milliseconds')
const {
  postToDeviceApi,
  getMaxDeviceId,
  getDeviceType,
  getDevicesWithIdLargerThan,
} = require('../utils')
const { run } = require('../../../src/db')
const { waitForApproximately } = require('../../utils/generatorFunctionUtils')
const { createTestContext } = require('./alere_utils')

const server = supertest.agent('http://localhost:8080')
const { assert, expect } = chai

describe('Device API routes for Alere FTP Connector Device', () => {
  describe('authentication and registration', () => {
    describe('when no device API key is specified', () => {
      const { runTest, basicDevicePayload } = createTestContext(server)
      it('should respond with UNAUTHORIZED', () =>
        runTest(async () =>
          postToDeviceApi({
            authHeader: 'Bearer ',
            payload: basicDevicePayload,
            expectedStatusCode: 401,
          })
        ))
    })

    describe('when an unknown device API key is specified', () => {
      const { runTest, basicDevicePayload } = createTestContext(server)
      it('should respond with UNAUTHORIZED', () =>
        runTest(async () =>
          postToDeviceApi({
            authHeader: 'Bearer fg2g9cjx0njzgbfmkem0',
            payload: basicDevicePayload,
            expectedStatusCode: 401,
          })
        ))
    })

    describe('when a known device API key is specified', () => {
      describe('when the instrument serial of the result changes', () => {
        const firstDeviceSerial = 'FIRST1'
        const secondDeviceSerial = 'SECOND'
        let maxDeviceIdBefore = -1

        const context = createTestContext(server)
        const {
          beforeCreateAlereFtpConnectorApiKey,
          useAlereDeviceSerialNumber,
          runTest,
          afterCleanUp,
        } = context

        const basicResultPayload = {
          sample: {
            id: 'TEST SAMPLE ID 1',
          },
          consumable: {
            serial: 'CARTRIDGE1',
          },
          sender: {
            version: '0.24.5',
            operator: 'BRYAN',
          },
          startedOn: '2018-04-18T10:58:01',
          assay: {
            id: 'assayAlereQHiv12VLPlasma',
          },
          data: {
            resultNo: 1,
            sampleId: 'TEST SAMPLE ID 1',
            hiv2Result: 'Undetected',
            pickedUpOn: '2018-09-19T07:17:06',
            operator: 'BRYAN',
            hiv1PositiveControl: 'Pass',
            sampleDetection: 'Pass',
            deviceMode: '',
            timeStamp: '2018-04-18T10:58:01',
            deviceCheck: 'Pass',
            hiv1MNResult: 'Undetected',
            status: 'IUO',
            cartridgeId: 'CARTRIDGE1',
            hiv1OResult: 'Undetected',
            negativeControl: 'Pass',
            errorCode: '0',
            sourceFile:
              './watch\\partner_name\\07-05_FIRST1_2018-09-05-10-05-51.csv',
            testName: 'Alere\xe2\x84\xa2 q HIV-1/2 VL plasma',
            softwareVersion: '0.24.5',
            analysisCheck: 'Pass',
            hiv2PositiveControl: 'Pass',
          },
          rawData:
            '\tResult No;\tDevice Serial;\tTest Name;\tCartridge ID;\tSample ID;\tHIV-1 M/N cp/mL;\tHIV-1 O cp/mL;\tHIV-2 cp/mL;\tError Code;\tOperator;\tTimestamp;\tSample Detection;\tDevice;\tHIV-1 Positive Control;\tHIV-2 Positive Control;\tNegative Control;\tAnalysis;\tDevice Software;\tDevice Mode;\tStatus\n\t1;\tSOME_DEVICE_SERIAL;\tAlere™ q HIV-1/2 VL plasma;\tCARTRIDGE1;\tTEST SAMPLE ID 1;\tUndetected;\tUndetected;\tUndetected;\t0;\tBRYAN;\t2018-04-18 10:58:01;\tFail;\tPass;\t----;\t----;\t----;\t----;\t0.24.5;\t;\tIUO',
          category: [
            {
              id: 'NotDetected',
            },
            {
              id: 'NotDetected',
            },
          ],
        }

        before(async () =>
          run(async knex => {
            maxDeviceIdBefore = await getMaxDeviceId(knex)
            await beforeCreateAlereFtpConnectorApiKey()
            useAlereDeviceSerialNumber(firstDeviceSerial)
            const { deviceAuth, basicDevicePayload } = context
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                result: basicResultPayload,
              }),
            })
          })
        )
        after(afterCleanUp)

        describe('and the device serial number changes', () => {
          it('should create a new device', () =>
            runTest(async knex => {
              const alereFtpConnectorDeviceType = await getDeviceType(
                'AlereFtpConnector',
                knex
              )
              const alereDeviceType = await getDeviceType('AlereQ', knex)
              const devicesCreatedDuringTestBefore = await getDevicesWithIdLargerThan(
                maxDeviceIdBefore,
                knex
              )
              expect(devicesCreatedDuringTestBefore).to.containSubset([
                {
                  deviceTypeId: alereFtpConnectorDeviceType.id,
                  serial: null,
                },
                {
                  serial: firstDeviceSerial,
                  deviceTypeId: alereDeviceType.id,
                },
              ])

              useAlereDeviceSerialNumber(secondDeviceSerial)
              const { deviceAuth, basicDevicePayload } = context
              await postToDeviceApi({
                authHeader: deviceAuth,
                payload: _.merge({}, basicDevicePayload, {
                  result: basicResultPayload,
                }),
              })
              const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(
                maxDeviceIdBefore,
                knex
              )
              expect(devicesCreatedDuringTestAfter).to.containSubset([
                {
                  deviceTypeId: alereFtpConnectorDeviceType.id,
                  serial: null,
                  configurationData: {},
                },
                {
                  serial: firstDeviceSerial,
                  deviceTypeId: alereDeviceType.id,
                },
                {
                  serial: secondDeviceSerial,
                  deviceTypeId: alereDeviceType.id,
                },
              ])
              expect(devicesCreatedDuringTestAfter.length).to.be.above(
                devicesCreatedDuringTestBefore.length
              )
            }))
        })

        describe('but device serial number remains the same', () => {
          it('should not create a new device update the the existing device', () =>
            runTest(async knex => {
              const devicesCreatedDuringTestBefore = await getDevicesWithIdLargerThan(
                maxDeviceIdBefore,
                knex
              )
              const { deviceAuth, basicDevicePayload } = context
              await postToDeviceApi({
                authHeader: deviceAuth,
                payload: _.merge({}, basicDevicePayload, {
                  result: basicResultPayload,
                }),
              })
              const devicesCreatedDuringTestAfter = await getDevicesWithIdLargerThan(
                maxDeviceIdBefore,
                knex
              )

              expect(devicesCreatedDuringTestAfter.length).to.equal(
                devicesCreatedDuringTestBefore.length
              )
            }))
        })
      })
    })
  })

  describe('results', () => {
    const deviceSerial = 'nat-04000248'
    const context = createTestContext(server)
    const {
      beforeCreateAlereFtpConnectorApiKey,
      useAlereDeviceSerialNumber,
      runTest,
      getLastResult,
      getCurrentAlereDevice,
      afterCleanUp,
    } = context

    const basicResultPayload = {
      sample: {
        id: 'TEST SAMPLE ID 2',
      },
      consumable: {
        serial: '128100304',
      },
      sender: {
        version: '0.20.12',
        operator: 'BRYAN',
      },
      startedOn: '2018-04-22T15:04:28',
      assay: {
        id: 'assayAlereQHiv12Detect',
      },
      data: {
        resultNo: 2,
        sampleId: 'TEST SAMPLE ID 2',
        hiv2Result: 'Undetected',
        pickedUpOn: '2018-09-19T07:17:06',
        operator: 'BRYAN',
        hiv1PositiveControl: 'Pass',
        sampleDetection: 'Pass',
        deviceMode: '',
        timeStamp: '2018-04-22T15:04:28',
        deviceCheck: 'Pass',
        hiv1MNResult: 'Detected',
        status: 'IUO',
        cartridgeId: 'CARTRIDGE2',
        hiv1OResult: 'Undetected',
        negativeControl: 'Pass',
        errorCode: '0',
        sourceFile:
          './watch\\partner_name\\07-05_FIRST1_2018-09-05-10-05-51.csv',
        testName: 'Alere q HIV-1/2 Detect',
        softwareVersion: '0.20.12',
        analysisCheck: 'Pass',
        hiv2PositiveControl: 'Pass',
      },
      rawData:
        'Result No;Device Serial;Test Name;Cartridge ID;Sample ID;HIV-1 M/N;HIV-1 O;HIV-2;Error Code;Operator;Timestamp;Sample Detection;Device;HIV-1 Positive Control;HIV-2 Positive Control;Negative Control;Analysis;Device Software\n49;nat-04000248;Alere q HIV-1/2 Detect;128100304;TEST SAMPLE ID 2;Detected;Undetected;Undetected;0;BRYAN;2018-04-22 15:04:28;Pass;Pass;Pass;Pass;Pass;Pass;0.20.12',
      category: [
        {
          id: 'Detected',
        },
        {
          id: 'NotDetected',
        },
      ],
    }

    before(async () =>
      run(async () => {
        await beforeCreateAlereFtpConnectorApiKey()
        useAlereDeviceSerialNumber(deviceSerial)
        const { deviceAuth, basicDevicePayload } = context
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            result: basicResultPayload,
          }),
        })
      })
    )
    after(afterCleanUp)

    it('should reject a result without a start date', () =>
      runTest(async () => {
        const beforeResultDetails = await getLastResult()
        const { deviceAuth, basicDevicePayload } = context
        const resultPayloadWithoutStartDate = _.merge({}, basicResultPayload, {
          startedOn: null,
        })
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            result: resultPayloadWithoutStartDate,
          }),
          expectedStatusCode: 400,
        })
        delete resultPayloadWithoutStartDate.startDate
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            result: resultPayloadWithoutStartDate,
          }),
          expectedStatusCode: 400,
        })

        const afterResultDetails = await getLastResult()
        expect(afterResultDetails).to.deep.equal(beforeResultDetails)
      }))

    it('should append a result if the instrument, sample, test date combination is not known', () =>
      runTest(async () => {
        const { now, deviceAuth, basicDevicePayload } = context
        const beforeResultDetails = await getLastResult()
        const testStartedOn = setMilliseconds(
          subMinutes(
            subHours(now, Math.floor(Math.random() * 24)),
            Math.floor(Math.random() * 60)
          ),
          0
        )

        const resultPayloadWithNewStartDate = _.merge({}, basicResultPayload, {
          startedOn: testStartedOn,
        })
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            result: resultPayloadWithNewStartDate,
          }),
        })

        const afterResultDetails = await getLastResult()
        expect(afterResultDetails.id).to.be.above(beforeResultDetails.id)
        const currentAlereDevice = await getCurrentAlereDevice()
        expect(afterResultDetails).to.containSubset({
          deviceId: currentAlereDevice.id,
          siteId: currentAlereDevice.siteId,
          geographyId: currentAlereDevice.geographyId,
          assay: resultPayloadWithNewStartDate.assay.id,
          resultWorkflowStatus: 'OK',
          resultSource: 'DiagnosticDevice',
          resultType: 'Patient',
          resultCategory1: 'Detected',
          resultCategory2: 'NotDetected',
          sampleId: resultPayloadWithNewStartDate.sample.id,
          sampleCollectedOn: null,
          sampleOriginSiteId: currentAlereDevice.siteId,
          sampleTypeId: null,
          resultData: resultPayloadWithNewStartDate.data,
          startedOn: testStartedOn,
          endedOn: null,
          consumableSerial: resultPayloadWithNewStartDate.consumable.serial,
          consumableExpirationDate: null,
          consumableLot: null,
          instrumentSerial: basicDevicePayload.result.instrument.serial,
          senderVersion: resultPayloadWithNewStartDate.sender.version,
          senderOperator: resultPayloadWithNewStartDate.sender.operator,
          notes: null,
          errorCode: null,
        })
      }))

    it('should update a result if the sample ID, instrument serial and test start times are known', () =>
      runTest(async () => {
        const { now, deviceAuth, basicDevicePayload } = context
        const beforeResultDetails = await getLastResult()
        const testStartedOn = setMilliseconds(
          subMinutes(
            subHours(now, Math.floor(Math.random() * 24)),
            Math.floor(Math.random() * 60)
          ),
          0
        )
        const sampleId = 'This test will be updated'
        const instrumentSerial = 'Tested on the same instrument'
        useAlereDeviceSerialNumber(instrumentSerial)
        const resultPayloadWithTestData = _.merge({}, basicResultPayload, {
          startedOn: testStartedOn,
          sample: { id: sampleId },
        })
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            result: resultPayloadWithTestData,
          }),
        })

        await waitForApproximately(2, 'seconds')

        const afterResultDetailsFirstResponse = await getLastResult()
        expect(afterResultDetailsFirstResponse.id).to.be.above(
          beforeResultDetails.id
        )
        const currentAlereDevice = await getCurrentAlereDevice()

        expect(afterResultDetailsFirstResponse).to.containSubset({
          deviceId: currentAlereDevice.id,
          siteId: currentAlereDevice.siteId,
          geographyId: currentAlereDevice.geographyId,
          assay: basicResultPayload.assay.id,
          resultWorkflowStatus: 'OK',
          resultSource: 'DiagnosticDevice',
          resultType: 'Patient',
          resultCategory1: 'Detected',
          resultCategory2: 'NotDetected',
          sampleId,
          sampleCollectedOn: null,
          sampleOriginSiteId: currentAlereDevice.siteId,
          sampleTypeId: null,
          resultData: basicResultPayload.data,
          startedOn: testStartedOn,
          endedOn: null,
          consumableSerial: basicResultPayload.consumable.serial,
          consumableExpirationDate: null,
          consumableLot: null,
          instrumentSerial,
          senderVersion: basicResultPayload.sender.version,
          senderOperator: basicResultPayload.sender.operator,
          notes: null,
          errorCode: null,
        })

        const resultPayloadWithUpatedTestData = _.merge(
          {},
          resultPayloadWithTestData,
          { sampleCollectedOn: now }
        )
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            result: resultPayloadWithUpatedTestData,
          }),
        })

        await waitForApproximately(2, 'seconds')

        const afterResultDetailsSecondResponse = await getLastResult()
        expect(afterResultDetailsFirstResponse.id).to.equal(
          afterResultDetailsSecondResponse.id
        )
        expect(afterResultDetailsSecondResponse).to.containSubset({
          deviceId: afterResultDetailsFirstResponse.deviceId,
          siteId: afterResultDetailsFirstResponse.siteId,
          geographyId: afterResultDetailsFirstResponse.geographyId,
          assay: afterResultDetailsFirstResponse.assay,
          assayVersion: afterResultDetailsFirstResponse.assayVersion,
          resultWorkflowStatus:
            afterResultDetailsFirstResponse.resultWorkflowStatus,
          resultSource: afterResultDetailsFirstResponse.resultSource,
          resultType: afterResultDetailsFirstResponse.resultType,
          resultCategory1: afterResultDetailsFirstResponse.resultCategory1,
          resultCategory2: afterResultDetailsFirstResponse.resultCategory2,
          sampleId: afterResultDetailsFirstResponse.sampleId,
          sampleOriginSiteId:
            afterResultDetailsFirstResponse.sampleOriginSiteId,
          sampleTypeId: afterResultDetailsFirstResponse.sampleTypeId,
          resultData: afterResultDetailsFirstResponse.resultData,
          startedOn: afterResultDetailsFirstResponse.startedOn,
          endedOn: afterResultDetailsFirstResponse.endedOn,
          consumableSerial: afterResultDetailsFirstResponse.consumableSerial,
          consumableExpirationDate:
            afterResultDetailsFirstResponse.consumableExpirationDate,
          consumableLot: afterResultDetailsFirstResponse.consumableLot,
          instrumentSerial: afterResultDetailsFirstResponse.instrumentSerial,
          senderVersion: afterResultDetailsFirstResponse.senderVersion,
          senderOperator: afterResultDetailsFirstResponse.senderOperator,
          notes: afterResultDetailsFirstResponse.notes,
          errorCode: afterResultDetailsFirstResponse.errorCode,
        })
        expect(
          new Date(afterResultDetailsSecondResponse.updatedOn)
        ).to.be.above(new Date(afterResultDetailsFirstResponse.updatedOn))
      }))

    it('should belong to the Alere device, not the Alere FTP Connector device', () =>
      runTest(async () => {
        const { deviceAuth, basicDevicePayload } = context
        const sampleId = 'device type test'
        const instrumentSerial = 'Tested on device type'
        useAlereDeviceSerialNumber(instrumentSerial)
        const resultPayloadWithTestData = _.merge({}, basicResultPayload, {
          sample: { id: sampleId },
        })
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            result: resultPayloadWithTestData,
          }),
        })
        const resultDetails = await getLastResult()
        const currentAlereDevice = await getCurrentAlereDevice()
        expect(currentAlereDevice.deviceTypeId).to.not.equal(
          context.device.deviceTypeId
        )
        expect(resultDetails.deviceId).to.equal(currentAlereDevice.id)
      }))

    it('should log the result under the Alere FTP Connector device', () =>
      runTest(async knex => {
        const { deviceAuth, basicDevicePayload } = context
        const sampleId = 'device log test'
        const instrumentSerial = 'Tested for device log'
        useAlereDeviceSerialNumber(instrumentSerial)
        const resultPayloadWithTestData = _.merge({}, basicResultPayload, {
          sample: { id: sampleId },
        })
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            result: resultPayloadWithTestData,
          }),
        })
        const resultDetails = await getLastResult()
        const deviceIdsInDeviceLogsForResult = await knex
          .from('DeviceLog')
          .where('resultId', resultDetails.id)
          .pluck('deviceId')
          .distinct()
        assert.deepEqual(deviceIdsInDeviceLogsForResult, [context.device.id])
      }))

    describe('when the assay in the result payload is unknown to Aspect', () => {
      it('should reject the data', () =>
        runTest(async () => {
          const sampleId = 'unknown assay test'
          const instrumentSerial = 'Unknown Assay'
          useAlereDeviceSerialNumber(instrumentSerial)
          const { deviceAuth, basicDevicePayload } = context
          const resultPayloadWithTestData = _.merge({}, basicResultPayload, {
            sample: { id: sampleId },
            assay: { id: 'Gobbledeegook' },
          })
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge({}, basicDevicePayload, {
              result: resultPayloadWithTestData,
            }),
            expectedStatusCode: 400,
          })
        }))
    })

    describe('when the assay in the result payload is mapped to a consumable', () => {
      const initialQuantityOnHand = 100
      let inventoryItemId

      it('should reduce inventory levels of that consumable appropriately', () =>
        runTest(async knex => {
          let { basicDevicePayload } = context
          const consumableAssay = await knex('ConsumableAssay as ca')
            .join('Assay as a', 'ca.assayId', 'a.id')
            .join('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
            .where({ 'dt.externalId': basicDevicePayload.type.id })
            .andWhere('ca.quantity', '>', 0)
            .first('ca.consumableId', 'ca.quantity', 'a.externalId as assayId')

          assert.isNotEmpty(consumableAssay)
          assert.isAbove(consumableAssay.quantity, 0)

          const instrumentSerial = 'instrument with inventory'
          useAlereDeviceSerialNumber(instrumentSerial)
          const { deviceAuth } = context
          ;({ basicDevicePayload } = context)
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge({}, basicDevicePayload, {
              result: basicResultPayload,
            }),
          })

          const sampleId = 'inventory deduct test'
          const resultPayloadWithTestData = _.merge({}, basicResultPayload, {
            sample: { id: sampleId },
          })
          const alereDevice = await getCurrentAlereDevice()
          const inventoryItemsAtSite = await knex('InventoryItem')
            .where({
              consumableId: consumableAssay.consumableId,
              siteId: alereDevice.siteId,
            })
            .select()
          if (_.isEmpty(inventoryItemsAtSite)) {
            ;[inventoryItemId] = await knex('InventoryItem').insert({
              consumableId: consumableAssay.consumableId,
              siteId: alereDevice.siteId,
              quantityOnHand: initialQuantityOnHand,
              updatedOn: subDays(
                new Date(resultPayloadWithTestData.startedOn),
                1
              ),
            })
          } else {
            ;({ id: inventoryItemId } = _.head(inventoryItemsAtSite))
            await knex('InventoryItem')
              .where('id', inventoryItemId)
              .update({
                quantityOnHand: initialQuantityOnHand,
                updatedOn: subDays(
                  new Date(resultPayloadWithTestData.startedOn),
                  1
                ),
              })
          }

          const inventoryLogsBefore = await knex('InventoryLog as il')
            .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
            .where({ inventoryItemId })
            .select(
              'il.consumableId',
              'il.siteId',
              'cr.name as consumableReason',
              'il.resultId',
              'il.quantity'
            )

          await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge({}, basicDevicePayload, {
              result: resultPayloadWithTestData,
            }),
          })

          const resultPayloadWithTestData2 = _.merge({}, basicResultPayload, {
            sample: { id: sampleId },
          })
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge({}, basicDevicePayload, {
              result: resultPayloadWithTestData2,
            }),
          })

          const resultDetails = await getLastResult()
          const inventoryItem = await knex('InventoryItem')
            .where({ id: inventoryItemId })
            .first()
          assert.equal(
            inventoryItem.quantityOnHand,
            _.max([0, initialQuantityOnHand - consumableAssay.quantity])
          )

          const inventoryLogsAfter = await knex('InventoryLog as il')
            .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
            .where({ inventoryItemId })
            .select(
              'il.consumableId',
              'il.siteId',
              'cr.name as consumableReason',
              'il.resultId',
              'il.quantity'
            )
          expect(inventoryLogsAfter).to.containSubset([
            ...inventoryLogsBefore,
            {
              consumableId: inventoryItem.consumableId,
              siteId: alereDevice.siteId,
              consumableReason: 'Test Conducted',
              resultId: resultDetails.id,
              quantity: consumableAssay.quantity,
            },
          ])
          expect(inventoryLogsAfter).to.have.lengthOf(
            inventoryLogsBefore.length + 1
          )
        }))

      describe('when the test already exists in the database', () => {
        it('should NOT reduce inventory levels of the consumable', () =>
          runTest(async knex => {
            let { basicDevicePayload } = context
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

            const sampleId1 = 'another stock test'
            const instrumentSerial = 'instrument with more stock'
            useAlereDeviceSerialNumber(instrumentSerial)
            const { deviceAuth } = context
            ;({ basicDevicePayload } = context)
            const resultPayloadWithTestData = _.merge({}, basicResultPayload, {
              sample: { id: sampleId1 },
            })
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                result: resultPayloadWithTestData,
              }),
            })

            const alereDevice = await getCurrentAlereDevice()

            const sampleId2 = 'yet another stock test'
            const resultPayloadWithTestData2 = _.merge({}, basicResultPayload, {
              sample: { id: sampleId2 },
            })

            const inventoryItemsAtSite = await knex('InventoryItem')
              .where({
                consumableId: consumableAssay.consumableId,
                siteId: alereDevice.siteId,
              })
              .select()
            if (_.isEmpty(inventoryItemsAtSite)) {
              ;[inventoryItemId] = await knex('InventoryItem').insert({
                consumableId: consumableAssay.consumableId,
                siteId: alereDevice.siteId,
                quantityOnHand: initialQuantityOnHand,
                updatedOn: subDays(
                  new Date(resultPayloadWithTestData2.startedOn),
                  1
                ),
              })
            } else {
              ;({ id: inventoryItemId } = _.head(inventoryItemsAtSite))
              await knex('InventoryItem')
                .where('id', inventoryItemId)
                .update({
                  quantityOnHand: initialQuantityOnHand,
                  updatedOn: subDays(
                    new Date(resultPayloadWithTestData2.startedOn),
                    1
                  ),
                })
            }

            await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                result: resultPayloadWithTestData2,
              }),
            })

            const resultDetailsAfterFirstPost = await getLastResult()
            const inventoryItemAfterFirstPost = await knex('InventoryItem')
              .where({ id: inventoryItemId })
              .first()
            assert.equal(
              inventoryItemAfterFirstPost.quantityOnHand,
              _.max([0, initialQuantityOnHand - consumableAssay.quantity])
            )

            const inventoryLogsAfterFirstPost = await knex('InventoryLog as il')
              .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
              .where({ inventoryItemId })
              .select(
                'il.consumableId',
                'il.siteId',
                'cr.name as consumableReason',
                'il.resultId',
                'il.quantity'
              )
            expect(inventoryLogsAfterFirstPost).to.containSubset([
              {
                consumableId: inventoryItemAfterFirstPost.consumableId,
                siteId: alereDevice.siteId,
                consumableReason: 'Test Conducted',
                resultId: resultDetailsAfterFirstPost.id,
                quantity: consumableAssay.quantity,
              },
            ])

            const resultPayloadWithTestData3 = _.merge({}, basicResultPayload, {
              sample: { id: sampleId2 },
              data: { fieldName: 'Some new data' },
            })
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, basicDevicePayload, {
                result: resultPayloadWithTestData3,
              }),
            })

            const resultDetailsAfterSecondPost = await getLastResult()
            const inventoryItemAfterSecondPost = await knex('InventoryItem')
              .where({ id: inventoryItemId })
              .first()
            expect(resultDetailsAfterSecondPost).to.containSubset(
              resultDetailsAfterFirstPost
            )
            expect(inventoryItemAfterSecondPost).to.deep.equal(
              inventoryItemAfterFirstPost
            )

            const inventoryLogsAfterSecondPost = await knex(
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
            expect(inventoryLogsAfterSecondPost).to.deep.equal(
              inventoryLogsAfterFirstPost
            )
          }))
      })
    })

    describe('when an error code has been specified in the result payload', () => {
      it('should set the workflow status of the result to error', () =>
        runTest(async () => {
          const sampleId = 'test error'
          const { deviceAuth, basicDevicePayload } = context
          const resultPayloadWithTestData = _.merge({}, basicResultPayload, {
            sample: { id: sampleId },
            error: { code: '12345' },
          })
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge({}, basicDevicePayload, {
              result: resultPayloadWithTestData,
            }),
          })
          const resultDetails = await getLastResult()
          expect(resultDetails).to.containSubset({
            errorCode: resultPayloadWithTestData.error.code,
            resultWorkflowStatus: 'Error',
          })
        }))
    })
  })
})
