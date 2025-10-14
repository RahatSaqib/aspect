const _ = require('lodash')
const chai = require('chai')
const {
  setMilliseconds,
  addMinutes,
  subMinutes,
  addHours,
  subHours,
  addDays,
  subDays,
  startOfDay,
  addYears,
  format: dateFormat,
} = require('date-fns')

const { startOfDayUtc } = require('../../../src/shared/date')
const { createGxAlertTestContext } = require('./gxalert_utils')
const { postToDeviceApi, getDeviceType } = require('../utils')
const { basicResultPayload } = require('./geneXpertConstants')
const { knex } = require('../../../src/db')
const {
  allDeviceMaintenanceStatusToId,
  deviceApprovalToId,
  resultCategoryToId,
} = require('../../../src/shared/dictionary')
const { getLocalDateTimeStringInUtc, getLocalDateInUtc, formatDateOrDefault } = require('../../../src/shared/date')
const { waitForApproximately } = require('../../utils/generatorFunctionUtils')
const { waitForIdle, waitForAction } = require('../../utils/mqUtils')
const shared = require('../../utils/sharedToken')
const { deviceSeen, types } = require('../../../src/device/actions')
const { factGenerateDeviceConnectivity } = require('../../../src/fact/actions')

const server = require('../../utils/testUtils')
const { assayNameToExternalId } = require('../../../src/shared/assayNameToExternalId')

const { assert, expect } = chai

/**
 * TODO: Delete this with GxAlert removal
 */
describe.skip('Device API routes for GxAlert Device', () => {
  shared.checkToken(server, '/api/device')
  function createContext() {
    return createGxAlertTestContext(server)
  }
  describe('ping', () => {
    const deviceName = 'GeneXpert Lab Pinged GxAlert'
    const deviceIdFromGxAlert = 8322
    const macAddress = 'MAC00000000PING'

    const context = createContext()
    const { beforeCreateGxAlertApiKey, useGxAlertDeviceId, getCurrentGeneXpertDevice, afterCleanUp } = context
    let { deviceAuth, basicDevicePayload } = context

    beforeEach(async () => {
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

    afterEach(afterCleanUp)

    it('should update the last seen and last ping time', async () => {
      const deviceBefore = await getCurrentGeneXpertDevice()

      const waitForDeviceSeen = waitForAction(deviceSeen(deviceBefore.id))
      await waitForApproximately(1, 'second')
      const response = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
          configuration: {
            data: { macAddress, gxAlertDeviceId: deviceIdFromGxAlert },
          },
        }),
      })
      response.body.device.id.should.equal(deviceBefore.id)

      await waitForDeviceSeen
      await waitForIdle()

      new Date(response.body.device.lastSeenOn).should.be.above(deviceBefore.lastSeenOn)
      new Date(response.body.device.lastPingOn).should.be.above(deviceBefore.lastPingOn)

      const deviceAfter = await getCurrentGeneXpertDevice()
      deviceAfter.id.should.equal(deviceBefore.id)
      deviceAfter.lastSeenOn.should.be.above(deviceBefore.lastSeenOn)
      deviceAfter.lastPingOn.should.be.above(deviceBefore.lastPingOn)
    })

    it('should eventually update the device fact offline status to false', async () => {
      const { id: deviceId } = await getCurrentGeneXpertDevice()

      const waitForFactGenerateDeviceConnectivity = waitForAction(factGenerateDeviceConnectivity(deviceId))
      await waitForFactGenerateDeviceConnectivity

      await knex('FactDeviceFlag').where({ deviceId }).update({ offline: 1 })
      let deviceFacts = await knex('FactDeviceFlag').where({ deviceId }).first()
      assert.ok(deviceFacts.offline)

      const waitForDeviceSeen = waitForAction(deviceSeen(deviceId))

      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: {
          name: deviceName,
          serial: null,
          approval: null,
          type: { id: 'CepheidGeneXpert' },
          site: null,
          log: null,
          configuration: {
            data: { macAddress, gxAlertDeviceId: deviceIdFromGxAlert },
          },
          operation: null,
          result: null,
        },
      })
      await waitForDeviceSeen
      await waitForIdle()

      deviceFacts = await knex('FactDeviceFlag').where({ deviceId }).first()
      assert.notOk(deviceFacts.offline)
    })
  })

  describe('results', () => {
    const gxAlertDeviceId = 23847
    const deviceName = 'This Lab Has Results!'

    const context = createContext()
    const now = new Date()
    const {
      beforeCreateGxAlertApiKey,
      useGxAlertDeviceId,
      basicDevicePayload,
      getLastResult,
      getResult,
      getCurrentGeneXpertDevice,
      afterCleanUp,
    } = context
    let { deviceAuth, device: gxAlertDevice } = context
    beforeEach(async () => {
      await beforeCreateGxAlertApiKey()
      useGxAlertDeviceId(gxAlertDeviceId)
      ;({ deviceAuth, device: gxAlertDevice } = context)
    })

    afterEach(afterCleanUp)

    it('should reject a result without a start or end date', async () => {
      const beforeResultDetails = await getLastResult()

      assert.isUndefined(beforeResultDetails)

      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload),
        expectedStatusCode: 400,
      })

      const afterResultDetails = await getLastResult()
      assert.isUndefined(afterResultDetails)
    })

    it('should append a result if the instrument, sample, test date combination is not known', async () => {
      const now = new Date()
      const beforeResultDetails = await getLastResult()

      assert.isUndefined(beforeResultDetails)

      const testStartedOn = setMilliseconds(
        subMinutes(subHours(now, Math.floor(Math.random() * 24)), Math.floor(Math.random() * 60)),
        0
      )

      const response = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.assign({}, _.assign({}, basicDevicePayload, basicResultPayload), {
          result: _.assign({}, basicResultPayload.result, {
            sample: { id: 'new sample' },
            instrument: { serial: 'new instrument' },
            startedOn: testStartedOn,
          }),
        }),
        expectedStatusCode: 200,
      })
      assert.typeOf(response.body, 'Object')

      const afterResultDetails = await getLastResult()
      const currentGeneXpertDevice = await getCurrentGeneXpertDevice()

      // this device is located in the America/New_York time zone, so we have to
      // convert testStartedOn to UTC in order to compare it to the value in the database
      expect(afterResultDetails).to.containSubset({
        deviceId: currentGeneXpertDevice.id,
        siteId: currentGeneXpertDevice.siteId,
        geographyId: currentGeneXpertDevice.geographyId,
        assay: basicResultPayload.result.assay.id,
        assayVersion: basicResultPayload.result.assay.version,
        resultWorkflowStatus: 'Deliverable',
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
    })

    it('should update a result if the sample ID, instrument serial and test start times are known', async () => {
      const now = new Date()
      const testStartedOn = setMilliseconds(
        subMinutes(subHours(now, Math.floor(Math.random() * 24)), Math.floor(Math.random() * 60)),
        0
      )
      const sampleId = 'This test will be updated'
      const instrumentSerial = 'Tested on the same instrument'

      // Send a new result
      const firstResponse = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
          result: {
            sample: { id: sampleId },
            instrument: { serial: instrumentSerial },
            startedOn: testStartedOn,
          },
        }),
        expectedStatusCode: 200,
      })

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
      const secondResponse = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
          result: {
            sample: { id: sampleId },
            instrument: { serial: instrumentSerial },
            startedOn: testStartedOn,
            data: newResultData,
          },
        }),
        expectedStatusCode: 200,
      })

      const {
        body: { result: firstResult },
      } = firstResponse
      const {
        body: { result: secondResult },
      } = secondResponse
      assert.equal(secondResult.id, firstResult.id)
      assert.equal(secondResult.createdOn, firstResult.createdOn)
      expect(JSON.parse(secondResult.resultData)).to.containSubset(newResultData)
      expect(new Date(secondResult.updatedOn)).to.be.above(new Date(firstResult.updatedOn))
    })

    it('should merge results with same sample ID, start time, end time and instrument serial', async () => {
      const { deviceAuth } = context

      const resultIds = []
      const countResults = () =>
        knex('Result')
          .count('id as cnt')
          .then(([{ cnt }]) => cnt)
      const initialCount = await countResults()

      let deviceApiResponse = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
          result: {
            id: dateFormat(new Date(), 'T'),
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
        }),
        expectedStatusCode: 200,
      })
      resultIds.push(deviceApiResponse.body.result.id)

      let result1 = await knex('Result as r').where({ id: resultIds[0] }).first()
      expect(JSON.parse(result1.resultData)).to.containSubset({ a: 'b' })
      assert.isNotOk(result1.errorCode)
      assert.equal(initialCount + 1, await countResults())
      deviceApiResponse = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
          result: {
            id: dateFormat(new Date(), 'T'),
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
        }),
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
        payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
          result: {
            id: dateFormat(new Date(), 'T'),
            startedOn: subMinutes(now, 5),
            endedOn: now,
            instrument: {
              serial: 'CEPH-PC-7813',
            },
            sample: {
              id: "Bryan's Sputum 2",
            },
            data: { a: 'b' },
            assay: { id: 'GxHiv1Vl' },
          },
        }),
        expectedStatusCode: 200,
      })
      let lastResultId = deviceApiResponse.body.result.id
      assert.notEqual(lastResultId, resultIds[0])

      resultIds.push(lastResultId)

      let result2 = await knex('Result as r').where({ id: resultIds[1] }).first()
      assert.equal(initialCount + 2, await countResults())

      const result1SampleSite = await knex('Site as s').where({ id: result1.siteId }).first()

      const result2SampleSite = await knex('Site as s')
        .where('partnerId', result1SampleSite.partnerId)
        .where('id', '<>', result1.siteId)
        .first()

      deviceApiResponse = await postToDeviceApi({
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
            workflow: { status: { id: 'Acknowledged' } },
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
        }),
        expectedStatusCode: 200,
      })
      lastResultId = deviceApiResponse.body.result.id
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
      assert.approximately(result2.latitude, 30.419348, 0.000001)
      assert.approximately(result2.longitude, -87.581222, 0.000001)
      assert.equal(result2.consumableSerial, '132-44-222')
      assert.deepEqual(result2.consumableExpirationDate, new Date('2014-03-01'))
      assert.equal(result2.consumableLot, '331')
      assert.equal(result2.instrumentSerial, 'CEPH-PC-7813')
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

      assert.notEqual(result2.siteId, result2Sample.originSiteId)
      assert.equal(result2SampleSite.id, result2Sample.originSiteId)
      assert.equal(result2Sample.externalId, "Bryan's Sputum 2")

      const [result2Category1, result2Category2] = await knex('ResultCategory as rt')
        .whereIn('id', [result2.resultCategory1, result2.resultCategory2])
        .select('externalId')
      assert.equal(result2Category1.externalId, 'Detected')
      assert.equal(result2Category2.externalId, 'Indeterminate')
    })

    it('should update a result if the sample ID and startedOn date matches an existing result', async () => {
      const now = new Date()
      const testStartedOn = setMilliseconds(
        subMinutes(subHours(now, Math.floor(Math.random() * 24)), Math.floor(Math.random() * 60)),
        0
      )
      const sampleId = 'dupe'
      const instrumentSerial = 'Tested on the same instrument'

      // Send a new result
      const firstResponse = await postToDeviceApi({
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

      await waitForApproximately(2, 'seconds')

      // Send another result with the same sample ID, but different start date
      const secondResponse = await postToDeviceApi({
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

      const {
        body: { result: firstResult },
      } = firstResponse
      const {
        body: { result: secondResult },
      } = secondResponse
      assert.equal(secondResult.id, firstResult.id)
      assert.equal(secondResult.createdOn, firstResult.createdOn)
      assert.equal(JSON.parse(secondResult.resultData).geneXpertTestId, 'unique_id_2')
      expect(new Date(secondResult.updatedOn)).to.be.above(new Date(firstResult.updatedOn))
    })

    it('should update a result and set result category 2 correctly if it was previously set and is now null', async () => {
      const now = new Date()
      const testStartedOn = setMilliseconds(
        subMinutes(subHours(now, Math.floor(Math.random() * 24)), Math.floor(Math.random() * 60)),
        0
      )
      const sampleId = 'dupe'
      const instrumentSerial = 'Tested on the same instrument'

      // Send a new result
      const firstResponse = await postToDeviceApi({
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

      await waitForApproximately(2, 'seconds')

      // Send another result with the same sample ID, but different start date
      const secondResponse = await postToDeviceApi({
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

      const {
        body: { result: firstResult },
      } = firstResponse
      const {
        body: { result: secondResult },
      } = secondResponse
      assert.equal(secondResult.id, firstResult.id)

      const [result] = await knex('Result').select('resultCategory1', 'resultCategory2').where('id', firstResult.id)

      assert.equal(result.resultCategory1, await resultCategoryToId('NotDetected'))
      assert.equal(result.resultCategory2, null)
    })

    it('should append (NOT update) a result if the sample ID matches an existing result, but the startedOn date does not', async () => {
      const now = new Date()
      const testStartedOn = setMilliseconds(
        subMinutes(subHours(now, Math.floor(Math.random() * 24)), Math.floor(Math.random() * 60)),
        0
      )
      const sampleId = 'dupe'
      const instrumentSerial = 'Tested on the same instrument'

      // Send a new result
      const firstResponse = await postToDeviceApi({
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

      await waitForApproximately(2, 'seconds')

      // Send another result with the same sample ID, but different start date
      const secondResponse = await postToDeviceApi({
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

      assert.notEqual(secondResponse.body.result.id, firstResponse.body.result.id)
    })

    it('should belong to the GeneXpert device, not the GxAlert device', async () => {
      const now = new Date()
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
          result: {
            startedOn: setMilliseconds(subDays(now, 3), 0),
          },
        }),
      })
      const result = await getLastResult()
      const geneXpertDevice = await getCurrentGeneXpertDevice()
      const geneXpertDeviceType = await getDeviceType('CepheidGeneXpert', knex)
      assert.notEqual(gxAlertDevice.id, geneXpertDevice.id)
      assert.equal(geneXpertDevice.deviceTypeId, geneXpertDeviceType.id)
      assert.equal(result.deviceId, geneXpertDevice.id)
    })

    it('should log the result under the GxAlert device', async () => {
      const now = new Date()
      const resultId = 'ID_FOR_CHECKING_DEVICE_LOGS'
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
          result: {
            id: resultId,
            startedOn: setMilliseconds(subDays(now, 3), 0),
          },
        }),
      })
      const result = await getLastResult()
      assert.equal(result.resultData.geneXpertTestId, resultId)
      const deviceIdsInDeviceLogsForResult = await knex
        .from('DeviceLog')
        .where('resultId', result.id)
        .pluck('deviceId')
        .distinct()
      assert.deepEqual(deviceIdsInDeviceLogsForResult, [gxAlertDevice.id])
    })

    it('should respond with the result that has been updated', async () => {
      const now = new Date()
      const resultId = 'A_RESULT_ID'
      const response = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
          result: {
            id: resultId,
            startedOn: setMilliseconds(subDays(now, 3), 0),
          },
        }),
      })
      assert.equal(JSON.parse(response.body.result.resultData).geneXpertTestId, resultId)
    })

    it('should get the module name from a previous result on the same module serial if it is not included in the payload', async () => {
      const now = new Date()
      const testStartedOn = setMilliseconds(
        subMinutes(subHours(now, Math.floor(Math.random() * 24)), Math.floor(Math.random() * 60)),
        0
      )

      // Send a new result
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
          result: {
            id: 'unique_id_1',
            sample: { id: 'sample_id_1' },
            instrument: {
              serial: '820799',
              module: {
                serial: '724158',
                name: 'A3',
              },
            },
            consumable: {
              serial: '12345',
            },
            startedOn: testStartedOn,
          },
        }),
        expectedStatusCode: 200,
      })

      // Send another result with missing module name
      _.unset(basicResultPayload, 'result.instrument.module.name')
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
          result: {
            id: 'unique_id_2',
            sample: { id: 'sample_id_2' },
            instrument: {
              serial: '820799',
              module: {
                serial: '724158',
              },
            },
            consumable: {
              serial: '12346',
            },
            startedOn: setMilliseconds(addMinutes(testStartedOn, 1), 0),
          },
        }),
        expectedStatusCode: 200,
      })

      const afterResultDetails = await getLastResult()
      expect(afterResultDetails.moduleName).to.equal('A3')
    })

    describe(`result's effect on device maintenance status`, () => {
      it('should change the maintenance status of an inactive device to active', async () => {
        useGxAlertDeviceId(gxAlertDeviceId)
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            configuration: {},
          }),
        })
        let geneXpertDevice = await getCurrentGeneXpertDevice()
        const deviceMaintenanceStatuses = await allDeviceMaintenanceStatusToId()
        const startedOnDate = setMilliseconds(new Date(), 0)
        const startedOn = formatDateOrDefault(startedOnDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")
        const endedOnDate = addHours(startedOnDate, 2)
        const endedOn = formatDateOrDefault(endedOnDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")
        const [deviceMaintenanceStatusLogId] = await knex('DeviceMaintenanceStatusLog').insert({
          deviceId: geneXpertDevice.id,
          deviceMaintenanceStatusId: deviceMaintenanceStatuses.inactiveUnknown,
          day: startOfDay(endedOnDate),
          data: '{}',
          createdOn: new Date(),
        })
        await knex('Device').where('id', geneXpertDevice.id).update({
          deviceMaintenanceStatusLogId,
        })
        const resultId = 'A_RESULT_FROM_INACTIVE_DEVICE'
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
            result: {
              id: resultId,
              startedOn,
              endedOn,
            },
          }),
        })
        await waitForAction({ type: types.DEVICE_MAINTENANCE_STATUS_LOGGED })
        await waitForIdle()
        geneXpertDevice = await getCurrentGeneXpertDevice()
        assert.equal(geneXpertDevice.deviceMaintenanceStatus, 'active')
        const latestMaintenanceStatusLog = await knex('DeviceMaintenanceStatusLog')
          .where('deviceId', geneXpertDevice.id)
          .orderByRaw('createdOn desc, id desc')
          .first()
        expect(latestMaintenanceStatusLog).to.containSubset({
          day: getLocalDateInUtc(startOfDay(endedOnDate)),
          deviceMaintenanceStatusId: deviceMaintenanceStatuses.active,
        })
        assert.equal(latestMaintenanceStatusLog.day.toISOString(), startOfDayUtc(endedOnDate).toISOString())
      })

      it('should change the maintenance status of an inactive device to active for the day that the test was done', async () => {
        useGxAlertDeviceId(gxAlertDeviceId)
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            configuration: {},
          }),
        })
        let geneXpertDevice = await getCurrentGeneXpertDevice()
        const deviceMaintenanceStatuses = await allDeviceMaintenanceStatusToId()
        const approvedId = await deviceApprovalToId('approved')
        const startedOnDate = setMilliseconds(subDays(new Date(), 5), 0)
        const startedOn = dateFormat(startedOnDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")

        const endedOnDate = addHours(startedOnDate, 2)
        const endedOn = dateFormat(endedOnDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")
        const endedOnDateInUtc = getLocalDateTimeStringInUtc(endedOn.replace('Z', ''), 'America/New_York')

        const [deviceMaintenanceStatusLogId] = await knex('DeviceMaintenanceStatusLog').insert([
          {
            deviceId: geneXpertDevice.id,
            deviceMaintenanceStatusId: deviceMaintenanceStatuses.inactiveUnknown,
            day: getLocalDateInUtc(startOfDay(endedOnDateInUtc)),
            data: '{}',
            createdOn: new Date(),
          },
          {
            deviceId: geneXpertDevice.id,
            deviceMaintenanceStatusId: deviceMaintenanceStatuses.inactiveUnknown,
            day: getLocalDateInUtc(startOfDay(new Date())),
            data: '{}',
            createdOn: new Date(),
          },
        ])
        await knex('Device').where('id', geneXpertDevice.id).update({
          deviceMaintenanceStatusLogId,
          deviceApprovalId: approvedId,
        })
        let devicesResponse = await server
          .get('/api/device/maintenance-status')
          .set('Authorization', `Bearer ${shared.token}`)
          .query({
            deviceIds: geneXpertDevice.id,
            minDate: dateFormat(subDays(startedOnDate, 1), 'yyyy-MM-dd'),
          })
        assert.equal(devicesResponse.body.data.length, 1)
        devicesResponse.body.data.forEach(device => {
          device.days.forEach(day => {
            assert.equal(day.externalId, 'inactiveUnknown')
          })
        })
        const resultId = 'ANOTHER_RESULT_FROM_INACTIVE_DEVICE'
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
            result: {
              id: resultId,
              startedOn,
              endedOn,
            },
          }),
        })
        await waitForAction({ type: types.DEVICE_MAINTENANCE_STATUS_LOGGED })
        await waitForIdle()
        geneXpertDevice = await getCurrentGeneXpertDevice()
        assert.equal(geneXpertDevice.deviceMaintenanceStatus, 'inactiveUnknown')
        devicesResponse = await server
          .get('/api/device/maintenance-status')
          .set('Authorization', `Bearer ${shared.token}`)
          .query({
            deviceIds: geneXpertDevice.id,
            minDate: dateFormat(subDays(startedOnDate, 1), 'yyyy-MM-dd'),
          })
        assert.equal(devicesResponse.body.data.length, 1)
        devicesResponse.body.data[0].days.forEach(day => {
          if (
            new Date(day.date) < startOfDayUtc(addDays(endedOnDate, 1)) &&
            new Date(day.date) >= startOfDayUtc(endedOnDate)
          ) {
            assert.equal(day.externalId, 'active')
          } else {
            assert.equal(day.externalId, 'inactiveUnknown')
          }
        })
      })
    })

    describe('when the assay in the result payload is unknown to Aspect', async () => {
      const assayName = 'New Assay Type'
      after(async () => knex('Assay').where({ externalId: assayName }).delete())

      it('should set the result to assay GxUnknown', async () => {
        const now = new Date()
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
          payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
            result: {
              id: resultId,
              startedOn: subHours(testStartedOn, 2),
              endedOn: testStartedOn,
              assay: {
                id: assayName,
                version: assayVersion,
              },
              data: {
                assay: 'New Assay Type',
              },
              instrument: {
                serial: '20345230',
              },
              sample: {
                id: 'Sample with Unknown Assay',
              },
            },
          }),
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
      })
    })

    describe('when the assay in the result payload is mapped to a consumable', () => {
      const initialQuantityOnHand = 100
      beforeEach(async () => {
        const { deviceAuth, basicDevicePayload } = context
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
          }),
        })
      })

      it('should reduce inventory levels of that consumable appropriately', async () => {
        const now = new Date()

        const consumableAssay = await knex('ConsumableAssay as ca')
          .join('Assay as a', 'ca.assayId', 'a.id')
          .join('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
          .where({ 'dt.externalId': basicDevicePayload.type.id })
          .andWhere('ca.quantity', '>', 0)
          .first('ca.consumableId', 'ca.quantity', 'a.externalId as assayId')

        const geneXpertDevice = await getCurrentGeneXpertDevice()
        await knex('InventoryItem').insert({
          consumableId: consumableAssay.consumableId,
          siteId: geneXpertDevice.siteId,
          quantityOnHand: initialQuantityOnHand,
        })

        assert.isNotEmpty(consumableAssay)
        assert.isAbove(consumableAssay.quantity, 0)

        const testStartedOn = setMilliseconds(subDays(now, 3), 0)
        const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)

        const response = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
            result: {
              id: dateFormat(new Date(), 'T'),
              startedOn: testStartedOn,
              endedOn: testEndedOn,
              sample: { id: 'Existing Sample' },
              instrument: { serial: 'Existing Instrument' },
              assay: {
                id: consumableAssay.assayId,
                version: '2',
              },
              data: {
                assay: Object.keys(assayNameToExternalId).find(
                  assayName => assayNameToExternalId[assayName] === consumableAssay.assayId
                ),
              },
            },
          }),
          expectedStatusCode: 200,
        })
        assert.typeOf(response.body, 'Object')

        const { id: lastResultId } = response.body.result

        const inventoryItemLog = await knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .join('InventoryItem as ii', 'ii.id', 'il.inventoryItemId')
          .where({ 'il.resultId': lastResultId })
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
        assert.equal(inventoryItemLog.quantityOnHand, 99)

        assert.deepEqual(inventoryItemLog, {
          consumableId: consumableAssay.consumableId,
          siteId: geneXpertDevice.siteId,
          consumableReason: 'Test Conducted',
          resultId: lastResultId,
          quantity: -1,
          expiresOn: null,
          lotNumber: null,
          quantityOnHand: 99,
        })
      })

      describe('when the test already exists in the database', () => {
        it('should NOT reduce inventory levels of the consumable', async () => {
          const uniqueTestId = dateFormat(new Date(), 'T')
          const consumableAssays = await knex('ConsumableAssay as ca')
            .join('Assay as a', 'ca.assayId', 'a.id')
            .join('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
            .where({ 'dt.externalId': basicDevicePayload.type.id })
            .andWhere('ca.quantity', '>', 0)
            .select('ca.consumableId', 'ca.quantity', 'a.externalId as assayId')

          assert.isNotEmpty(consumableAssays)
          assert.isAbove(_.sumBy(consumableAssays, 'quantity'), 0)

          const now = new Date()
          const geneXpertDevice = await getCurrentGeneXpertDevice()
          const expiryDate = new Date(addYears(now, 1).setHours(0, 0, 0, 0))
          const [inventoryItemId] = await knex('InventoryItem').insert({
            consumableId: _.head(consumableAssays).consumableId,
            siteId: geneXpertDevice.siteId,
            expiresOn: expiryDate,
            quantityOnHand: initialQuantityOnHand,
            createdOn: subDays(now, 4),
            updatedOn: subDays(now, 4),
          })

          const inventoryItemBefore = await knex('InventoryItem').where({ id: inventoryItemId }).first()

          const testStartedOn = setMilliseconds(
            subMinutes(subHours(now, Math.floor(Math.random() * 24)), Math.floor(Math.random() * 60)),
            0
          )
          const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
          const sampleId = 'This test will reduce inventory once'
          const instrumentSerial = 'Same instrument serial'

          const assayExternalId = _.head(consumableAssays).assayId

          // Send first test
          const firstResponse = await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
              result: {
                id: uniqueTestId,
                assay: {
                  id: assayExternalId,
                  version: '2',
                },
                data: {
                  assay: Object.keys(assayNameToExternalId).find(
                    assayName => assayNameToExternalId[assayName] === assayExternalId
                  ),
                },
                sample: { id: sampleId },
                instrument: { serial: instrumentSerial },
                startedOn: testStartedOn,
                endedOn: testEndedOn,
                consumable: {
                  expirationDate: expiryDate,
                },
              },
            }),
            expectedStatusCode: 200,
          })
          const { siteId: siteIdFromFirstRequest } = await knex('Device as d')
            .where('d.id', firstResponse.body.device.id)
            .first('d.siteId')
          const {
            body: {
              result: { id: resultIdAfterFirstRequest },
            },
          } = firstResponse

          const inventoryItemsAfterFirstRequest = await knex('InventoryItem')
            .whereIn('consumableId', _.map(consumableAssays, 'consumableId'))
            .andWhere({
              siteId: siteIdFromFirstRequest,
              expiresOn: getLocalDateInUtc(expiryDate),
            })
            .select()

          const inventoryItemAfterFirstRequest = _.find(inventoryItemsAfterFirstRequest, {
            id: inventoryItemId,
          })
          expect(inventoryItemBefore.quantityOnHand).to.be.above(inventoryItemAfterFirstRequest.quantityOnHand)
          const inventoryLogsAfterFirstRequest = await knex('InventoryLog as il')
            .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
            .where({ inventoryItemId })
            .select('il.consumableId', 'il.siteId', 'cr.name as consumableReason', 'il.resultId', 'il.quantity')
          expect(inventoryLogsAfterFirstRequest).to.containSubset([
            {
              siteId: siteIdFromFirstRequest,
              consumableReason: 'Test Conducted',
              resultId: resultIdAfterFirstRequest,
            },
          ])
          const matchingConsumableAssayAfterFirstRequest = _.find(consumableAssays, {
            consumableId: _.head(inventoryLogsAfterFirstRequest).consumableId,
            quantity: -_.head(inventoryLogsAfterFirstRequest).quantity,
          })
          assert.isNotEmpty(matchingConsumableAssayAfterFirstRequest)

          // Send update to test
          const newResultData = {
            customFieldData: {
              1: {
                notAvailable: false,
                label: 'HIV Status',
                value: 'HIV Negative',
              },
              2: {
                notAvailable: false,
                label: 'Visual Analysis',
                value: 'Spotty',
              },
            },
          }
          const secondResponse = await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
              result: {
                id: uniqueTestId,
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
            }),
            expectedStatusCode: 200,
          })
          const { siteId: siteIdFromSecondRequest } = await knex('Device as d')
            .where('d.id', secondResponse.body.device.id)
            .first('d.siteId')
          assert.equal(siteIdFromSecondRequest, siteIdFromFirstRequest)
          const {
            body: {
              result: { id: resultIdAfterSecondRequest },
            },
          } = secondResponse
          assert.equal(resultIdAfterSecondRequest, resultIdAfterFirstRequest)

          const inventoryItemsAfterSecondRequest = await knex('InventoryItem')
            .whereIn('consumableId', _.map(consumableAssays, 'consumableId'))
            .andWhere({
              siteId: siteIdFromSecondRequest,
              expiresOn: getLocalDateInUtc(expiryDate),
            })
            .select()

          const inventoryItemAfterSecondRequest = _.find(inventoryItemsAfterSecondRequest, {
            id: inventoryItemId,
          })
          assert.equal(inventoryItemAfterFirstRequest.quantityOnHand, inventoryItemAfterSecondRequest.quantityOnHand)
          const inventoryLogsAfterSecondRequest = await knex('InventoryLog as il')
            .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
            .where({ inventoryItemId })
            .select('il.consumableId', 'il.siteId', 'cr.name as consumableReason', 'il.resultId', 'il.quantity')
          assert.deepEqual(inventoryLogsAfterSecondRequest, inventoryLogsAfterFirstRequest)
          const matchingConsumableAssayAfterSecondRequest = _.find(consumableAssays, {
            consumableId: _.head(inventoryLogsAfterSecondRequest).consumableId,
            quantity: -_.head(inventoryLogsAfterSecondRequest).quantity,
          })
          assert.isNotEmpty(matchingConsumableAssayAfterSecondRequest)
        })
      })
    })

    describe('when an error code has been specified in the result payload', () => {
      it('should set the workflow status of the result to error', async () => {
        const now = new Date()
        const errorTestResultId = 'UNIQUE-ID-WITH-ERROR-RESULT'
        const errorCode = '12345'

        const testStartedOn = setMilliseconds(subDays(now, 3), 0)
        const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
            result: {
              id: errorTestResultId,
              startedOn: testStartedOn,
              endedOn: testEndedOn,
              error: {
                code: errorCode,
              },
            },
          }),
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
      })
    })

    describe('when the result text contains "ERROR"', () => {
      it('should set the workflow status of the result to error', async () => {
        const now = new Date()
        const errorTestResultId = 'UNIQUE-ID-WITH-ERROR-RESULT'

        const testStartedOn = setMilliseconds(subDays(now, 3), 0)
        const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
            result: {
              id: errorTestResultId,
              startedOn: testStartedOn,
              endedOn: testEndedOn,
              data: { resultText: 'ERROR' },
            },
          }),
        })

        const lastResult = await getLastResult()
        expect(lastResult).to.containSubset({
          resultCategory1: 'Error',
          resultWorkflowStatus: 'Error',
          resultData: {
            geneXpertTestId: errorTestResultId,
          },
        })
      })
    })

    describe('when no workflow status has been specified in the result payload', () => {
      it('should default the workflow status to "Deliverable"', async () => {
        const now = new Date()
        const testResultId = 'UNIQUE-ID-WITH-DELIVERABLE-RESULT'

        const testStartedOn = setMilliseconds(subDays(now, 3), 0)
        const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
            result: {
              id: testResultId,
              startedOn: testStartedOn,
              endedOn: testEndedOn,
            },
          }),
        })

        const lastResult = await getLastResult()
        expect(lastResult).to.containSubset({
          resultWorkflowStatus: 'Deliverable',
        })
      })
    })

    describe('when the result comes from a site that has location data saved', () => {
      beforeEach(async () => {
        const { deviceAuth, basicDevicePayload } = context
        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
          }),
        })
      })

      describe('and the result has NO coordinates specified in the payload', () => {
        it('should set the the GPS coordinates of the result to those of the site/device', async () => {
          const now = new Date()
          const latitude = Math.random() * 360
          const longitude = Math.random() * 360
          const geneXpertDevice = await getCurrentGeneXpertDevice()
          const { id: geographyId } = await knex('Geography as g')
            .join('Country as c', 'g.countryId', 'c.id')
            .where('c.abbreviation', geneXpertDevice.countryAbbreviation)
            .whereNotNull('g.stateId')
            .whereNotNull('g.lgaId')
            .first('g.id')

          await knex('Site').where({ id: geneXpertDevice.siteId }).update({ latitude, longitude, geographyId })

          const gpsCoordsMissingResultId = 'UNIQUE-ID-WITHOUT-GPS-COORDS'
          const testStartedOn = setMilliseconds(
            subMinutes(subHours(now, Math.floor(Math.random() * 24)), Math.floor(Math.random() * 60)),
            0
          )
          const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
          const {
            body: {
              result: { id: resultId },
            },
          } = await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
              result: {
                id: gpsCoordsMissingResultId,
                startedOn: testStartedOn,
                endedOn: testEndedOn,
              },
            }),
          })

          const result = await knex('Result as r')
            .innerJoin('Site as s', 'r.siteId', 's.id')
            .where('r.id', resultId)
            .first('r.latitude', 'r.longitude', 's.geographyId')
          const resultSite = await knex('Site').where({ id: geneXpertDevice.siteId }).first()
          expect(result).to.containSubset({
            latitude: resultSite.latitude,
            longitude: resultSite.longitude,
            geographyId: resultSite.geographyId,
          })
        })
      })

      describe('and the result HAS coordinates specified in the payload', () => {
        it('should set the the GPS coordinates of the ones specified in the payload and the geography to that of the site that the result came from', async () => {
          const now = new Date()
          const siteLatitude = Math.random() * 360
          const siteLongitude = Math.random() * 360
          const geneXpertDevice = await getCurrentGeneXpertDevice()
          const { id: geographyId } = await knex('Geography as g')
            .join('Country as c', 'g.countryId', 'c.id')
            .where('c.abbreviation', geneXpertDevice.countryAbbreviation)
            .whereNotNull('g.stateId')
            .whereNotNull('g.lgaId')
            .first('g.id')
          await knex('Site').where({ id: geneXpertDevice.siteId }).update({
            latitude: siteLatitude,
            longitude: siteLongitude,
            geographyId,
          })
          const gpsCoordsInResultId = 'UNIQUE-ID-WITH-GPS-COORDS'
          const resultLatitude = Math.random() * 360
          const resultLongitude = Math.random() * 360
          assert.notEqual(siteLatitude, resultLatitude)
          assert.notEqual(siteLongitude, resultLongitude)
          const testStartedOn = setMilliseconds(
            subMinutes(subHours(now, Math.floor(Math.random() * 24)), Math.floor(Math.random() * 60)),
            0
          )
          const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
          await postToDeviceApi({
            authHeader: deviceAuth,
            payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
              result: {
                id: gpsCoordsInResultId,
                startedOn: testStartedOn,
                endedOn: testEndedOn,
                location: {
                  latitude: resultLatitude,
                  longitude: resultLongitude,
                },
              },
            }),
          })
          await waitForIdle()

          const lastResult = await getLastResult()
          const resultSite = await knex('Site').where({ id: lastResult.siteId }).first()
          assert.notEqual(lastResult.latitude, resultSite.latitude)
          assert.notEqual(lastResult.longitude, resultSite.longitude)
          assert.equal(lastResult.geographyId, geographyId)
        })
      })
    })

    describe('when the result was previously sent', () => {
      const now = new Date()
      describe('incomplete with no end time', () => {
        describe('and is sent again with an end time and a result', () => {
          it("should merge with the existing result, matched by instrument and cartridge serials, and update it's external ID", async () => {
            const { deviceAuth } = context
            const instrumentSerial = '803165'
            const cartridgeSerial = '725194650'
            const startedOnDate = setMilliseconds(now, 0)
            const startedOn = dateFormat(startedOnDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")

            const incompleteResultPayload = _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
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
            })
            delete incompleteResultPayload.result.id
            // Initial incomplete result details
            let deviceApiResponse = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: incompleteResultPayload,
              expectedStatusCode: 200,
            })

            const {
              body: {
                result: {
                  id: incompleteResultId,
                  externalId: incompleteResultExternalId,
                  siteId: incompleteSiteId,
                  deviceId: incompleteDeviceId,
                },
              },
            } = deviceApiResponse

            const incompleteResult = await getResult(incompleteResultId)
            expect(incompleteResult).to.containSubset({
              externalId: incompleteResultExternalId,
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
                name: 'different Device',
                endedOn,
                data: { resultText: 'DETECTED MEDIUM|INDETERMINATE|' },
              },
            })
            // Then complete result details
            deviceApiResponse = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: completeResultPayload,
              expectedStatusCode: 200,
            })

            const {
              body: {
                result: {
                  id: completeResultId,
                  externalId: completeResultExternalId,
                  siteId: completeSiteId,
                  deviceId: completeDeviceId,
                },
              },
            } = deviceApiResponse

            const completeResult = await getResult(completeResultId)
            expect(completeResult).to.containSubset({
              externalId: completeResultExternalId,
              resultCategory1: 'Detected',
              resultCategory2: 'Indeterminate',
              startedOn: startedOnDate,
              endedOn: endedOnDate,
              resultData: {
                resultText: 'DETECTED MEDIUM|INDETERMINATE|',
              },
            })
            assert.equal(completeSiteId, incompleteSiteId, 'site should be the same')
            assert.equal(completeDeviceId, incompleteDeviceId, 'device should be the same')
            assert.equal(completeResultId, incompleteResultId, 'resultId should be the same')
            assert.notEqual(completeResultExternalId, incompleteResultExternalId, 'externalId should be different')
          })

          it("if cartridge serial is not valid, should NOT merge with the existing result, matched by instrument and cartridge serials, and update it's external ID", async () => {
            const { deviceAuth } = context
            const instrumentSerial = '803165'
            const cartridgeSerial = '12345'
            const startedOnDate = setMilliseconds(now, 0)
            const startedOn = dateFormat(startedOnDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")
            const endedOnDate = addMinutes(startedOnDate, 103)
            const endedOn = dateFormat(endedOnDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")

            const incompleteResultPayload = _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
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
            })
            delete incompleteResultPayload.result.id
            // Initial incomplete result details
            let deviceApiResponse = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: incompleteResultPayload,
              expectedStatusCode: 200,
            })
            const {
              body: {
                result: { id: incompleteResultId },
              },
            } = deviceApiResponse

            const completeResultPayload = _.merge({}, incompleteResultPayload, {
              result: {
                sample: { id: 'othersample' },
                endedOn,
                data: { resultText: 'DETECTED MEDIUM|INDETERMINATE|' },
              },
            })

            // Then complete result details
            deviceApiResponse = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: completeResultPayload,
              expectedStatusCode: 200,
            })
            const {
              body: {
                result: { id: completeResultId },
              },
            } = deviceApiResponse
            assert.notEqual(incompleteResultId, completeResultId)
          })

          it('if Device Api Key changes, the result must not change device or site', async () => {
            const { deviceAuth } = context
            const instrumentSerial = '803165'
            const cartridgeSerial = '725194650'
            const startedOnDate = setMilliseconds(now, 0)
            const startedOn = dateFormat(startedOnDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")

            const incompleteResultPayload = _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
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
            })
            delete incompleteResultPayload.result.id
            // Initial incomplete result details
            let deviceApiResponse = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: incompleteResultPayload,
              expectedStatusCode: 200,
            })

            const {
              body: {
                result: {
                  id: incompleteResultId,
                  externalId: incompleteResultExternalId,
                  siteId: incompleteSiteId,
                  deviceId: incompleteDeviceId,
                },
              },
            } = deviceApiResponse

            const incompleteResult = await getResult(incompleteResultId)
            expect(incompleteResult).to.containSubset({
              externalId: incompleteResultExternalId,
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
                name: 'different Device',
                endedOn,
                data: { resultText: 'DETECTED MEDIUM|INDETERMINATE|' },
              },
            })
            const newContext = createContext() // Changing API Key, the device is different, but the result should not update site or device
            await newContext.beforeCreateGxAlertApiKey()
            const { deviceAuth: newDeviceAuth } = newContext
            // Then complete result details
            deviceApiResponse = await postToDeviceApi({
              authHeader: newDeviceAuth,
              payload: completeResultPayload,
              expectedStatusCode: 200,
            })

            const {
              body: {
                result: {
                  id: completeResultId,
                  externalId: completeResultExternalId,
                  siteId: completeSiteId,
                  deviceId: completeDeviceId,
                },
              },
            } = deviceApiResponse

            const completeResult = await getResult(completeResultId)
            expect(completeResult).to.containSubset({
              externalId: completeResultExternalId,
              resultCategory1: 'Detected',
              resultCategory2: 'Indeterminate',
              startedOn: startedOnDate,
              endedOn: endedOnDate,
              resultData: {
                resultText: 'DETECTED MEDIUM|INDETERMINATE|',
              },
            })
            assert.equal(completeSiteId, incompleteSiteId, 'site should be the same')
            assert.equal(completeDeviceId, incompleteDeviceId, 'device should be the same')
            assert.equal(completeResultId, incompleteResultId, 'resultId should be the same')
            assert.notEqual(completeResultExternalId, incompleteResultExternalId, 'externalId should be different')
          })
        })
      })

      describe('complete with result', () => {
        describe('and is sent again with no result in the result text', () => {
          it('should ignore the result data that has been sent', async () => {
            const { deviceAuth } = context
            const instrumentSerial = '803165'
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
            const deviceApiResponse = await postToDeviceApi({
              authHeader: deviceAuth,
              payload: completeResultPayload,
              expectedStatusCode: 200,
            })
            const {
              body: {
                result: { id: completeResultId, externalId: completeResultExternalId },
              },
            } = deviceApiResponse

            let completeResult = await getResult(completeResultId)
            expect(completeResult).to.containSubset({
              externalId: completeResultExternalId,
              resultCategory1: 'Detected',
              resultCategory2: 'NotDetected',
              startedOn: startedOnDate,
              endedOn: endedOnDate,
              resultData: {
                resultText: 'MTB DETECTED MEDIUM||RIF Resistance NOT DETECTED',
              },
            })

            // Then send NO RESULT
            await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, completeResultPayload, {
                result: {
                  data: { resultText: 'NO RESULT|NO RESULT|' },
                },
              }),
              expectedStatusCode: 201,
            })
            completeResult = await getResult(completeResultId)
            expect(completeResult).to.containSubset({
              resultCategory1: 'Detected',
              resultCategory2: 'NotDetected',
              startedOn: startedOnDate,
              endedOn: endedOnDate,
              resultData: {
                resultText: 'MTB DETECTED MEDIUM||RIF Resistance NOT DETECTED',
              },
            })

            await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, completeResultPayload, {
                result: {
                  data: { resultText: 'NO RESULT' },
                },
              }),
              expectedStatusCode: 201,
            })
            completeResult = await getResult(completeResultId)
            expect(completeResult).to.containSubset({
              resultCategory1: 'Detected',
              resultCategory2: 'NotDetected',
              startedOn: startedOnDate,
              endedOn: endedOnDate,
              resultData: {
                resultText: 'MTB DETECTED MEDIUM||RIF Resistance NOT DETECTED',
              },
            })

            await postToDeviceApi({
              authHeader: deviceAuth,
              payload: _.merge({}, completeResultPayload, {
                result: {
                  data: { resultText: 'MTB DETECTED MEDIUM|NO RESULT' },
                },
              }),
              expectedStatusCode: 200,
            })
            completeResult = await getResult(completeResultId)
            expect(completeResult).to.containSubset({
              resultCategory1: 'Detected',
              resultCategory2: 'NoResult',
              startedOn: startedOnDate,
              endedOn: endedOnDate,
              resultData: {
                resultText: 'MTB DETECTED MEDIUM|NO RESULT',
              },
            })
          })
        })
      })
    })

    it('should create 2 different results (fixing bug ASP-1972)', async () => {
      const now = new Date()
      const beforeResultDetails = await getLastResult()

      assert.isUndefined(beforeResultDetails)

      const testStartedOn = setMilliseconds(
        subMinutes(subHours(now, Math.floor(Math.random() * 24)), Math.floor(Math.random() * 60)),
        0
      )

      const response = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, { name: deviceName }, basicResultPayload, {
          result: {
            sample: { id: 'new sample' },
            instrument: { serial: 'new instrument' },
            startedOn: testStartedOn,
          },
        }),
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
        resultWorkflowStatus: 'Deliverable',
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
        moduleName: null,
        moduleSerial: basicResultPayload.result.instrument.module.serial,
        patientData: {
          ...basicResultPayload.result.patient,
          phone: '+10833243682',
        },
        senderVersion: basicResultPayload.result.sender.version,
        senderOperator: basicResultPayload.result.sender.operator,
        notes: null,
        errorCode: null,
      })
    })
  })
})
