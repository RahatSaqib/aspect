const chai = require('chai')
const chaiSubset = require('chai-subset')
const _ = require('lodash')
const { addHours } = require('date-fns')
const { knex } = require('../../src/db')
const { resultTypeToId } = require('../../src/shared/dictionary')
const { resultReadyForNotification } = require('../../src/result/actions')

const { createTestContext, getDeviceConfigurationData, getLastResultId, createSite } = require('./utils')

const { waitForIdle, waitForAction } = require('../utils/mqUtils')

const server = require('../utils/testUtils')

const { assert, expect } = chai.use(chaiSubset)

const devicePath = '/device'

const baseConfig = {
  requirePrinter: 'yes',
  adminPassword: 'pwd123',
  firmwareUpdateRequired: 'no',
}

// Number of milliseconds to wait for completion of
// asynchronous updates as acceptance criteria
const ASYNC_TEST_ACCEPTANCE_TIME = 250
describe('Device Result API routes', () => {
  // Waits acceptance time and resolves promise with optional result
  function waitAsyncComplete(result) {
    return new Promise(resolve => setTimeout(resolve, ASYNC_TEST_ACCEPTANCE_TIME)).then(waitForIdle).then(() => result)
  }

  const apiResultPath = '/api/result'

  describe('admin result updates', () => {
    const context = createTestContext(knex, server, {
      user: 'admin',
      type: 'CepheidGeneXpert',
      partner: 'Partner One',
      baseConfig,
    })

    const { runTest } = context

    const clinicianUsername = 'admin'
    const clinicianPassword = 'test07'
    const getClinicianAccessToken = async () => {
      const res = await server.post('/api/auth').send({
        name: clinicianUsername,
        password: clinicianPassword,
        clientName: 'Mocha web',
      })
      return res.body.access
    }

    beforeEach(async () => {
      await context.createDeviceWithResult({ instrumentSerial: 'Aa123456' })
    })

    afterEach(context.afterEach)

    it('should add and return device results', () =>
      runTest(async knex => {
        const resultIds = []
        const { deviceId, clientAuth, deviceAuth, now } = context

        const clientSingleResultPath = `${apiResultPath}/`
        const clientPath = `${apiResultPath}?deviceId=${deviceId}&size=1000`

        const getResultResponse1 = await server.get(clientPath).set('Authorization', clientAuth)
        assert.equal(getResultResponse1.status, 200)
        assert.typeOf(getResultResponse1.body, 'Object')
        assert.property(getResultResponse1.body, 'data')
        assert.typeOf(getResultResponse1.body.data, 'array')

        const initialDataLength = getResultResponse1.body.data.length

        let lastResultId = await getLastResultId(knex, deviceId)
        if (lastResultId) {
          resultIds.push(lastResultId)
        }
        const deviceChangedName = `Device Changed Name ${new Date()}`

        const resultPayload = {
          startedOn: now,
          data: { assay: 'Xpert MTB-RIF', a: 'b' },
          assay: { id: 'GxMtbRif' },
          instrument: { serial: 'Aa123456' },
          sample: { id: '29347293' },
        }
        const postNewResultResponse1 = await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            name: deviceChangedName,
            result: resultPayload,
          })
        assert.equal(postNewResultResponse1.status, 200)
        assert.typeOf(postNewResultResponse1.body, 'Object')

        lastResultId = await getLastResultId(knex, deviceId)
        if (lastResultId && !resultIds.includes(lastResultId)) {
          resultIds.push(lastResultId)
        }
        const getResultResponse2 = await server.get(clientPath).set('Authorization', clientAuth)
        assert.equal(getResultResponse2.status, 200)
        assert.typeOf(getResultResponse2.body, 'Object')
        assert.property(getResultResponse2.body, 'data')
        assert.typeOf(getResultResponse2.body.data, 'array')
        assert.equal(getResultResponse2.body.data.length, initialDataLength + 1)

        const lastResult = _.find(getResultResponse2.body.data, {
          id: lastResultId,
        })
        assert.typeOf(lastResult, 'Object')
        assert.equal(lastResult.id, lastResultId)

        const result1 = await knex('Result as r').where({ id: lastResultId }).first()

        const tagsResult1 = await knex('Result as r')
          .join('ResultTag as rt', 'r.id', 'rt.resultId')
          .join('Tag as t', 'rt.tagid', 't.id')
          .where({ 'r.id': lastResultId })
          .select('t.*')

        assert.equal(tagsResult1.length, 0)
        assert.deepEqual(JSON.parse(result1.resultData), { assay: 'Xpert MTB-RIF', a: 'b' })

        const result1Type = await knex('ResultType as rt').where({ id: result1.resultTypeId }).first('externalId')

        assert.equal(result1Type.externalId, 'Patient')

        const result1Source = await knex('ResultSource as rs').where({ id: result1.resultSourceId }).first('externalId')

        assert.equal(result1Source.externalId, 'DiagnosticDevice')

        const result1Sample = await knex('Sample as s').where({ id: result1.sampleId }).first()

        assert.equal(result1.siteId, result1Sample.originSiteId)
        assert.equal(result1Sample.collectedOn, null)
        assert.equal(result1Sample.sampleTypeId, null)

        const result1SampleSite = await knex('Site as s').where({ id: result1Sample.originSiteId }).first()

        assert.equal(result1.siteId, result1Sample.originSiteId)

        const result1Assay = await knex('Assay as assay').where({ id: result1.assayId }).first('externalId', 'name')

        assert.equal(result1Assay.externalId, 'GxMtbRif')
        assert.equal(result1Assay.name, 'GeneXpert MTB/Rif')

        const [result1Category1, result1Category2] = await knex('ResultCategory as rt')
          .whereIn('id', [result1.resultCategory1, result1.resultCategory2])
          .select('externalId')

        assert.equal(result1Category1.externalId, 'Success')
        assert.isNotOk(result1Category2)

        const result2SampleSite = await knex('Site as s')
          .where('partnerId', result1SampleSite.partnerId)
          .where('id', '<>', result1.siteId)
          .first()

        const postNewResultResponse2 = await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            result: {
              data: { assay: 'Xpert MTB-RIF', a: 'b', c: 2, d: false, e: { f: 'g' } },
              type: { id: 'Study' },
              source: { id: 'EnteredByHand' },
              category: [{ id: 'Detected' }, { id: 'Indeterminate' }],
              assay: {
                id: 'GxMtbRif',
                version: '1a.c1',
              },
              sample: {
                id: `Sample${now}`,
                group: 'Sample Group X-1',
                runNumber: '10z',
                collectedOn: '2013-11-25',
                type: {
                  id: 'DBS',
                },
                originSite: {
                  id: result2SampleSite.externalId,
                },
              },
              startedOn: '2013-12-01',
              endedOn: '2013-12-01T01:30:00.000Z',
              consumable: {
                serial: '132-44-222',
                expirationDate: '2014-03-01',
                lot: '331',
              },
              instrument: {
                serial: 'Aa123456',
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
                maker: 'XYZ',
                model: '876A',
                serial: '123-456-789',
              }),
              rawData: JSON.stringify({
                startedOn: '2013-05-13',
                endedOn: '2013-12-01T01:30:00.000Z',
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
              }),
              sender: {
                version: '99-1',
                operator: 'Bob O',
              },
              notes: 'My Awesome notes about this Awesome result!, 123-12',
              error: {
                code: '123',
                notes: 'Oh NOZE!',
              },
            },
          })
        assert.equal(postNewResultResponse2.status, 200)
        assert.typeOf(postNewResultResponse2.body, 'Object')

        lastResultId = await getLastResultId(knex, deviceId)
        if (lastResultId && !resultIds.includes(lastResultId)) {
          resultIds.push(lastResultId)
        }
        const getResultResponse3 = await server
          .get(clientPath)
          .query({ displayResult: 'all' })
          .set('Authorization', clientAuth)
        assert.equal(getResultResponse3.status, 200)
        assert.typeOf(getResultResponse3.body, 'Object')
        assert.property(getResultResponse3.body, 'data')
        assert.typeOf(getResultResponse3.body.data, 'array')

        assert.equal(getResultResponse3.body.data.length, initialDataLength + 2)

        const result2 = await knex('Result as r').where({ 'r.id': lastResultId }).first()
        const tagsResult2 = await knex('Result as r')
          .join('ResultTag as rt', 'r.id', 'rt.resultId')
          .join('Tag as t', 'rt.tagid', 't.id')
          .where({ 'r.id': result2.id })
          .select('t.*')
        assert.equal(tagsResult2[0].title, ', 123-12')
        assert.equal(tagsResult2[1].title, '-333')
        assert.deepEqual(JSON.parse(result2.resultData), {
          assay: 'Xpert MTB-RIF',
          a: 'b',
          c: 2,
          d: false,
          e: { f: 'g' },
        })
        assert.equal(result2.assayVersion, '1a.c1')
        assert.deepEqual(result2.startedOn, new Date('2013-12-01'))
        assert.deepEqual(result2.endedOn, new Date('2013-12-01T01:30:00.000Z'))
        assert.equal(result2.sampleGroup, 'Sample Group X-1')
        assert.equal(result2.sampleRunNumber, '10z')
        assert.equal(result2.consumableSerial, '132-44-222')
        assert.deepEqual(result2.consumableExpirationDate, new Date('2014-03-01'))
        assert.equal(result2.consumableLot, '331')
        assert.equal(result2.instrumentSerial, 'Aa123456')
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
          phone: '+18567909',
        })
        assert.deepEqual(JSON.parse(result2.oemData), {
          maker: 'XYZ',
          model: '876A',
          serial: '123-456-789',
        })
        assert.deepEqual(JSON.parse(result2.rawData), {
          startedOn: '2013-05-13',
          endedOn: '2013-12-01T01:30:00.000Z',
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
        })
        assert.equal(result2.senderVersion, '99-1')
        assert.equal(result2.senderOperator, 'Bob O')
        assert.equal(result2.notes, 'My Awesome notes about this Awesome result!, 123-12')
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
        assert.equal(result2Sample.externalId, `Sample${now}`)

        const [result2Category1, result2Category2] = await knex('ResultCategory as rt')
          .whereIn('id', [result2.resultCategory1, result2.resultCategory2])
          .select('externalId')
        assert.equal(result2Category1.externalId, 'Detected')
        assert.equal(result2Category2.externalId, 'Indeterminate')

        const [{ rawMessage: log2Raw, resultId: resultId2 }] = await knex('DeviceLog as dl')
          .innerJoin('Result as r', 'r.id', 'dl.resultId')
          .where({ 'r.id': lastResultId })
          .select('rawMessage', 'resultId')

        const deviceLogData = JSON.parse(log2Raw)

        assert.deepEqual(deviceLogData, {
          type: {
            id: 'CepheidGeneXpert',
          },
          deviceApiKey: deviceLogData.deviceApiKey, // TODO: Get the real device api key
          result: {
            data: { assay: 'Xpert MTB-RIF', a: 'b', c: 2, d: false, e: { f: 'g' } },
            type: { id: 'Study' },
            source: { id: 'EnteredByHand' },
            category: [{ id: 'Detected' }, { id: 'Indeterminate' }],
            assay: {
              id: 'GxMtbRif',
              version: '1a.c1',
            },
            sample: {
              id: `Sample${now}`,
              group: 'Sample Group X-1',
              runNumber: '10z',
              collectedOn: '2013-11-25',
              type: {
                id: 'DBS',
              },
              originSite: {
                id: result2SampleSite.externalId,
              },
            },
            startedOn: '2013-12-01',
            endedOn: '2013-12-01T01:30:00.000Z',
            consumable: {
              serial: '132-44-222',
              expirationDate: '2014-03-01',
              lot: '331',
            },
            instrument: {
              serial: 'Aa123456',
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
              maker: 'XYZ',
              model: '876A',
              serial: '123-456-789',
            }),
            rawData: JSON.stringify({
              startedOn: '2013-05-13',
              endedOn: '2013-12-01T01:30:00.000Z',
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
            }),
            sender: {
              version: '99-1',
              operator: 'Bob O',
            },
            notes: 'My Awesome notes about this Awesome result!, 123-12',
            error: {
              code: '123',
              notes: 'Oh NOZE!',
            },
          },
        })
        const getResultResponse4 = await server.get(clientSingleResultPath + resultId2).set('Authorization', clientAuth)

        assert.equal(getResultResponse4.status, 200)
        assert.typeOf(getResultResponse4.body, 'Object')
        assert.typeOf(getResultResponse4.body.data, 'Object')
        assert.typeOf(getResultResponse4.body.data.resultData, 'Object')
        assert.deepEqual(getResultResponse4.body.data.resultData, {
          assay: 'Xpert MTB-RIF',
          a: 'b',
          c: 2,
          d: false,
          e: { f: 'g' },
        })

        const postNewResultResponse4 = await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            includeDeviceConfiguration: false,
            name: deviceChangedName,
          })

        assert.equal(postNewResultResponse4.status, 200)
        assert.typeOf(postNewResultResponse4.body, 'Object')

        // Verify the device name hasn't changed (device name should not be updatable via device API)
        const deviceAfterNameChange = await knex('Device').where({ id: deviceId }).first('name')
        assert.notEqual(deviceAfterNameChange.name, deviceChangedName)
      }))

    it('should set the origin site details of the sample on insert', () =>
      runTest(async knex => {
        const resultIds = []
        const { deviceId, clientAuth, deviceAuth, now } = context
        const clientPath = `${apiResultPath}?deviceId=${deviceId}&size=1000`

        const getResultResponse1 = await server.get(clientPath).set('Authorization', clientAuth)
        assert.equal(getResultResponse1.status, 200)
        assert.typeOf(getResultResponse1.body, 'Object')
        assert.property(getResultResponse1.body, 'data')
        assert.typeOf(getResultResponse1.body.data, 'array')
        let lastResultId = await getLastResultId(knex, deviceId)
        if (lastResultId) {
          resultIds.push(lastResultId)
        }

        const existingSiteExternalId = 'ExistingOriginSite'
        const existingSiteId = await createSite(knex, {
          partner: context.partner,
          user: context.user,
          site: existingSiteExternalId,
        })
        context.siteIds.push(existingSiteId)

        const resultPayload = {
          startedOn: now,
          data: { assay: 'Xpert MTB-RIF', a: 'b' },
          assay: { id: 'GxMtbRif' },
          instrument: { serial: 'Aa123456' },
          sample: {
            id: '493284729',
            originSite: {
              id: existingSiteExternalId,
            },
          },
        }
        const postNewResultResponse = await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            name: 'Device Name',
            result: resultPayload,
          })
        assert.equal(postNewResultResponse.status, 200)
        assert.typeOf(postNewResultResponse.body, 'Object')

        lastResultId = await getLastResultId(knex, deviceId)
        if (lastResultId && !resultIds.includes(lastResultId)) {
          resultIds.push(lastResultId)
        }
        const resultSampleOriginSite = await knex('Result as r')
          .join('Sample as s', 'r.sampleId', 's.id')
          .join('Site as si', 's.originSiteId', 'si.id')
          .where('r.id', lastResultId)
          .first('si.*')
        assert.equal(resultSampleOriginSite.externalId, existingSiteExternalId)
        assert.equal(resultSampleOriginSite.id, existingSiteId)

        // Try to update the origin site - should not change
        const expectedSampleOriginSite = {
          id: existingSiteId,
          externalId: existingSiteExternalId,
          name: 'New name for site',
          shortName: 'New name',
          notes: 'this site has been updated',
          stateName: 'New Province',
          lgaName: 'New District',
          city: 'Springfield',
          street1: '123 New Avenue',
          street2: 'In a suburb',
          zip: '12345',
          latitude: 12.12,
          longitude: 15.12,
          timezoneid: 'South Africa Standard Time',
          hoursStart: 9,
          hoursEnd: 17,
        }
        resultPayload.sample.originSite = {
          ...resultPayload.sample.originSite,
          name: expectedSampleOriginSite.name,
          shortName: expectedSampleOriginSite.shortName,
          notes: expectedSampleOriginSite.notes,
          state: expectedSampleOriginSite.stateName,
          lga: expectedSampleOriginSite.lgaName,
          city: expectedSampleOriginSite.city,
          street1: expectedSampleOriginSite.street1,
          street2: expectedSampleOriginSite.street2,
          zip: expectedSampleOriginSite.zip,
          timezoneId: expectedSampleOriginSite.timezoneid,
          hoursStart: expectedSampleOriginSite.hoursStart,
          hoursEnd: expectedSampleOriginSite.hoursEnd,
        }
        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            name: 'Device Name',
            result: resultPayload,
          })
        assert.equal(postNewResultResponse.status, 200)
        assert.typeOf(postNewResultResponse.body, 'Object')

        lastResultId = await getLastResultId(knex, deviceId)

        const updatedResultSampleOriginSite = await knex('Result as r')
          .leftJoin('Sample as s', 'r.sampleId', 's.id')
          .leftJoin('Site as si', 's.originSiteId', 'si.id')
          .leftJoin('Geography as g', 'si.geographyId', 'g.id')
          .leftJoin('State as st', 'g.stateId', 'st.id')
          .leftJoin('Lga as l', 'g.lgaId', 'l.id')
          .where('r.id', lastResultId)
          .first('si.*', 'st.name as stateName', 'l.name as lgaName')
        // Origin site should remain unchanged
        assert.equal(updatedResultSampleOriginSite.externalId, existingSiteExternalId)
        assert.equal(updatedResultSampleOriginSite.id, existingSiteId)
      }))

    it('should set default result status and categories', () =>
      runTest(async knex => {
        const resultIds = []
        const { deviceId, deviceAuth, now } = context

        const resultPayload = {
          startedOn: now,
          data: { a: 'b' },
          assay: { id: 'GxMtbRif' },
          instrument: { serial: 'Aa123456' },
          sample: { id: '76543789' },
        }
        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            result: resultPayload,
          })
          .then(res => {
            assert.equal(res.status, 200)
          })

        resultIds.push(await getLastResultId(knex, deviceId))

        const result1 = await knex('Result as r').where({ id: resultIds[0] }).first()

        assert.deepEqual(JSON.parse(result1.resultData), { a: 'b' })
        assert.isNotOk(result1.errorCode)

        const [result1Category1, result1Category2] = await knex('ResultCategory as rt')
          .whereIn('id', [result1.resultCategory1, result1.resultCategory2])
          .select('externalId')
        assert.equal(result1Category1.externalId, 'Success')
        assert.isNotOk(result1Category2)

        const resultErrorPayload = {
          startedOn: now,
          data: { a: 'c' },
          error: { code: '1' },
          assay: { id: 'GxMtbRif' },
          instrument: { serial: 'Aa123456' },
          sample: { id: '76543788' },
        }
        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            result: resultErrorPayload,
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        resultIds.push(await getLastResultId(knex, deviceId))

        const result2 = await knex('Result as r').where({ id: resultIds[1] }).first()

        assert.deepEqual(JSON.parse(result2.resultData), { a: 'c' })
        assert.equal(result2.errorCode, '1')

        const [result2Category1, result2Category2] = await knex('ResultCategory as rt')
          .whereIn('id', [result2.resultCategory1, result2.resultCategory2])
          .select('externalId')
        assert.equal(result2Category1.externalId, 'Error')
        assert.isNotOk(result2Category2)

        const resultInvalidErrorPayload = {
          startedOn: now,
          data: { a: 'd' },
          category: { id: 'Invalid' },
          error: { code: '1' },
          assay: { id: 'GxMtbRif' },
          instrument: { serial: 'Aa123456' },
          sample: { id: '76543787' },
        }
        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            result: resultInvalidErrorPayload,
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        resultIds.push(await getLastResultId(knex, deviceId))

        const result3 = await knex('Result as r').where({ id: resultIds[2] }).first()
        assert.deepEqual(JSON.parse(result3.resultData), { a: 'd' })
        assert.equal(result3.errorCode, '1')

        const [result3Category1, result3Category2] = await knex('ResultCategory as rt')
          .whereIn('id', [result3.resultCategory1, result3.resultCategory2])
          .select('externalId')
        assert.equal(result3Category1.externalId, 'Invalid')
        assert.isNotOk(result3Category2)

        const resultDetectedNotDetectedPayload = {
          startedOn: now,
          data: { a: 'e' },
          category: [{ id: 'Detected' }, { id: 'NotDetected' }],
          assay: { id: 'GxMtbRif' },
          instrument: { serial: 'Aa123456' },
          sample: { id: '76543786' },
        }
        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            result: resultDetectedNotDetectedPayload,
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        resultIds.push(await getLastResultId(knex, deviceId))

        const result4 = await knex('Result as r').where({ id: resultIds[3] }).first()
        assert.deepEqual(JSON.parse(result4.resultData), { a: 'e' })
        assert.isNotOk(result4.errorCode)

        const [result4Category1, result4Category2] = await knex('ResultCategory as rt')
          .whereIn('id', [result4.resultCategory1, result4.resultCategory2])
          .select('externalId')
        assert.equal(result4Category1.externalId, 'Detected')
        assert.equal(result4Category2.externalId, 'NotDetected')
      }))
    it('should set result as EQA if sample.id contains Exclude pattern', () =>
      runTest(async knex => {
        const excludeSampleId = 'ExcludeMeLalala'
        const resultIds = []
        const { deviceId, deviceAuth, now } = context
        const EqaResultTypeId = await resultTypeToId('EQA')

        const resultPayload = {
          startedOn: now,
          data: { a: 'b' },
          assay: { id: 'GxMtbRif' },
          instrument: { serial: 'Aa123456' },
          patient: {
            id: 'PAT-DFD-1234',
            name: 'Bob',
            surname: 'Hope',
            gender: 'M',
            age: 72,
            dateOfBirth: '1903-05-29',
            address: '123 Main Street',
            phone: '856-7909',
          },
          sample: { id: excludeSampleId },
        }
        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            result: resultPayload,
          })
          .then(res => {
            assert.equal(res.status, 200)
          })

        resultIds.push(await getLastResultId(knex, deviceId))

        const result1 = await knex('Result as r').where({ id: resultIds[0] }).first()

        assert.equal(result1.resultTypeId, EqaResultTypeId)
        assert.isNotOk(result1.errorCode)
      }))

    it('should set result as EQA if sampleId contains Exclude pattern', () =>
      runTest(async knex => {
        const excludeSampleId = 'ExcludeMeLalala'
        const resultIds = []
        const { deviceId, deviceAuth, now } = context
        const EqaResultTypeId = await resultTypeToId('EQA')

        const resultPayload = {
          startedOn: now,
          data: { a: 'b', sampleId: excludeSampleId },
          assay: { id: 'GxMtbRif' },
          instrument: { serial: 'Aa123456' },
          patient: {
            name: 'Bob',
            surname: 'Hope',
            gender: 'M',
            age: 72,
            dateOfBirth: '1903-05-29',
            address: '123 Main Street',
            phone: '856-7909',
          },
          sample: { id: '76543789' },
        }
        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            result: resultPayload,
          })
          .then(res => {
            assert.equal(res.status, 200)
          })

        resultIds.push(await getLastResultId(knex, deviceId))

        const result1 = await knex('Result as r').where({ id: resultIds[0] }).first()

        assert.equal(result1.resultTypeId, EqaResultTypeId)
        assert.isNotOk(result1.errorCode)
      }))

    it('should merge results with same id', () =>
      runTest(async knex => {
        const mobileSampleExternalId = '453-250925-002'
        const { deviceId, deviceAuth, now } = context

        const resultIds = []
        const resultExternalIds = []
        resultExternalIds.push(`R1${now}`, `R2${now}`)
        const countResults = () =>
          knex('Result')
            .count('id as cnt')
            .then(([{ cnt }]) => cnt)
        const initialCount = await countResults()

        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            result: {
              id: resultExternalIds[0],
              startedOn: now,
              data: { assay: 'Xpert MTB-RIF', a: 'b' },
              instrument: { serial: 'Aa123456' },
              assay: { id: 'GxMtbRif' },
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        resultIds.push(await getLastResultId(knex, deviceId))

        let result1 = await knex('Result as r').where({ id: resultIds[0] }).first()
        assert.equal(result1.externalId, resultExternalIds[0])
        assert.deepEqual(JSON.parse(result1.resultData), {
          geneXpertTestId: resultExternalIds[0],
          assay: 'Xpert MTB-RIF',
          a: 'b',
        })
        assert.isNotOk(result1.errorCode)
        assert.equal(initialCount + 1, await countResults())

        const samplePayload = {
          externalId: mobileSampleExternalId,
          collectedOn: new Date().toISOString(),
          clinicianName: 'Jen Harrelson',
          patientExternalId: 'J.Harrelson',
          originSiteId: result1.siteId,
          sampleTypeExternalId: 'Pus',
        }

        const clinicianAccessToken = await getClinicianAccessToken()
        const sampleRegisterPath = '/mobile/api/sample/register'
        await server
          .post(sampleRegisterPath)
          .set('Authorization', `Bearer ${clinicianAccessToken}`)
          .set('api-version', `4`)
          .send(samplePayload)

        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            result: {
              id: resultExternalIds[0],
              startedOn: now,
              data: { assay: 'Xpert MTB-RIF', a: 'b', c: 'd' },
              instrument: { serial: 'Aa123456' },
              assay: { id: 'GxMtbRif' },
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })

        let lastResultId = await getLastResultId(knex, deviceId)
        assert.equal(lastResultId, resultIds[0])

        result1 = await knex('Result as r').where({ id: resultIds[0] }).first()
        assert.equal(result1.externalId, resultExternalIds[0])
        assert.deepEqual(JSON.parse(result1.resultData), {
          geneXpertTestId: resultExternalIds[0],
          assay: 'Xpert MTB-RIF',
          a: 'b',
          c: 'd',
        })
        assert.isNotOk(result1.errorCode)
        assert.equal(initialCount + 1, await countResults(), 'Result count does not match')
        const startedOnT3 = '2013-12-01T00:22:54.000Z'
        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            result: {
              id: resultExternalIds[1],
              startedOn: startedOnT3,
              data: { assay: 'Xpert MTB-RIF', a: 'b' },
              assay: { id: 'GxMtbRif' },
              sample: {
                id: mobileSampleExternalId,
              },
              consumable: {
                serial: '132-44-222',
                expirationDate: '2014-03-01',
                lot: '331',
              },
              instrument: {
                serial: 'Aa123456',
              },
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })

        lastResultId = await getLastResultId(knex, deviceId)
        assert.notEqual(lastResultId, resultIds[0])
        resultIds.push(lastResultId)

        let result2 = await knex('Result as r').where({ id: resultIds[1] }).first()
        assert.notEqual(result2.externalId, resultExternalIds[1])
        assert.equal(initialCount + 2, await countResults())

        const result1SampleSite = await knex('Site as s').where({ id: result1.siteId }).first()

        const result2SampleSite = await knex('Site as s')
          .where('partnerId', result1SampleSite.partnerId)
          .where('id', '<>', result1.siteId)
          .first()
        // Simulate transfer
        await knex('ResultTransferLog').insert({
          resultId: result2.id,
          reportableSiteId: result2.siteId,
          sampleOriginSiteId: result2.siteId,
          previousReportableSiteId: result2.siteId,
          comment: 'Simulated transfer',
          createdOn: now,
          createdBy: 1,
        })
        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            result: {
              id: resultExternalIds[1],
              data: { assay: 'Xpert MTB-RIF', a: 'b', c: 2, d: false, e: { f: 'g' } },
              type: { id: 'Study' },
              source: { id: 'EnteredByHand' },
              category: [{ id: 'Detected' }, { id: 'Indeterminate' }],
              assay: {
                id: 'GxMtbRif',
                version: '1a.c1',
              },
              sample: {
                id: mobileSampleExternalId,
                type: {
                  id: 'Plasma',
                },
                originSite: {
                  id: result2SampleSite.externalId,
                },
              },
              startedOn: startedOnT3,
              endedOn: '2013-12-01T01:30:00.000Z',
              consumable: {
                serial: '132-44-222',
                expirationDate: '2014-03-01',
                lot: '331',
              },
              instrument: {
                serial: 'Aa123456',
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
                endedOn: '2013-12-01T01:30:00.000Z',
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
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        lastResultId = await getLastResultId(knex, deviceId)
        assert.equal(lastResultId, resultIds[1])

        result2 = await knex('Result as r').where({ id: resultIds[1] }).first()
        assert.equal(initialCount + 2, await countResults())
        assert.notEqual(result2.externalId, resultExternalIds[1])
        expect(JSON.parse(result2.resultData)).to.containSubset({
          a: 'b',
          c: 2,
          d: false,
          e: { f: 'g' },
        })
        assert.equal(result2.assayVersion, '1a.c1')
        assert.deepEqual(result2.startedOn.toISOString(), startedOnT3)
        assert.deepEqual(result2.endedOn, new Date('2013-12-01T01:30:00.000Z'))
        assert.equal(result2.consumableSerial, '132-44-222')
        assert.deepEqual(result2.consumableExpirationDate, new Date('2014-03-01'))
        assert.equal(result2.consumableLot, '331')
        assert.equal(result2.instrumentSerial, 'Aa123456')
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
          phone: '+18567909',
        })
        assert.deepEqual(JSON.parse(result2.oemData), {
          maker: 'ABC',
          model: '123A',
          serial: '123-456-789',
        })
        assert.deepEqual(JSON.parse(result2.rawData), {
          startedOn: '2013-05-13',
          endedOn: '2013-12-01T01:30:00.000Z',
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

        assert.equal(
          result2.siteId,
          result2Sample.originSiteId,
          'Sample origin site Id should not change on result updates if the sample was created in another site'
        )

        assert.notEqual(
          result2SampleSite.id,
          result2.siteId,
          'Sample origin site Id should not change on result updates'
        )

        assert.equal(
          result2.siteId,
          result2.reportableSiteId,
          'Result.reportableSiteId should not change on result updates if the result is transferred'
        )
        assert.equal(result2Sample.externalId, mobileSampleExternalId)

        const [result2Category1, result2Category2] = await knex('ResultCategory as rt')
          .whereIn('id', [result2.resultCategory1, result2.resultCategory2])
          .select('externalId')
        assert.equal(result2Category1.externalId, 'Detected')
        assert.equal(result2Category2.externalId, 'Indeterminate')
      }))

    it('should add and return device data', () =>
      runTest(async knex => {
        const { deviceId, deviceAuth, now } = context
        const resultIds = []
        const [{ count: initialLogLength }] = await knex('DeviceLog').count('id as count')

        const res = await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            configuration: { data: { a: 'b' } },
            operation: { data: { a: 'c' } },
            result: {
              startedOn: now,
              data: {
                assay: 'Xpert MTB-RIF',
                a: 'd',
              },
              sample: { id: '123-456789-012' },
              instrument: {
                serial: 'Aa123456',
              },
              assay: { id: 'GxMtbRif' },
            },
          })

        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')

        // The last reported instrument serial should be updated in the device table
        const { lastInstrumentSerial, deviceId: lastDeviceId } = await knex('Instrument')
          .orderBy('id', 'desc')
          .first('serial as lastInstrumentSerial', 'deviceId')
        assert.equal(lastInstrumentSerial, 'Aa123456')

        resultIds.push(await getLastResultId(knex, lastDeviceId))

        const [{ count: logLength2 }] = await knex('DeviceLog').count('id as count')
        assert.equal(logLength2, initialLogLength + 1) // I add new devicelog for the current device

        const deviceLogResult2 = await knex('Result')
          .where({ id: resultIds[resultIds.length - 1] })
          .first()
        const deviceLogConfig2 = await getDeviceConfigurationData(knex, lastDeviceId)

        assert.deepEqual(deviceLogConfig2, _.assign({}, baseConfig, { a: 'b' }))
        assert.property(deviceLogResult2, 'resultData')
        assert.deepEqual(JSON.parse(deviceLogResult2.resultData), { a: 'd', assay: 'Xpert MTB-RIF' })

        const deviceLogUpdates2 = await knex('DeviceLog').where({
          deviceConfigurationUpdated: true,
        })

        assert.equal(deviceLogUpdates2.length, 1)
        assert.isOk(deviceLogUpdates2[0].id)
        assert.equal(deviceLogUpdates2[0].resultId, deviceLogResult2.id)

        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            configuration: { data: { a: 'c' } },
            operation: { data: { a: 'd' } },
            result: {
              startedOn: now,
              data: { assay: 'Xpert MTB-RIF', a: 'd' },
              sample: { id: '123-456789-012' },
              instrument: {
                serial: 'Aa123456',
              },
              assay: { id: 'GxMtbRif' },
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        resultIds.push(await getLastResultId(knex, deviceId))

        const deviceLogConfig3 = await getDeviceConfigurationData(knex, deviceId)
        assert.deepEqual(deviceLogConfig3, _.assign({}, baseConfig, { a: 'c' }))
        const deviceLogUpdates3 = await knex('DeviceLog').where({
          deviceConfigurationUpdated: true,
        })

        assert.equal(deviceLogUpdates3.length, 2)
        assert.isOk(deviceLogUpdates3[1].id)
        assert.isOk(deviceLogUpdates3[1].resultId)
      }))

    describe.skip('the reportable site of a result', () => {
      const resultIds = []

      afterEach(async () => {
        const inventoryItemIds = await knex('InventoryLog').whereIn('resultId', resultIds).pluck('inventoryItemId')
        await knex('InventoryItem').whereIn('id', inventoryItemIds).delete()
        await knex('InventoryLog').whereIn('resultId', resultIds).delete()
        await knex('Result').whereIn('id', resultIds).delete()
      })

      it('should be set to the site of the device if the result does not specify an origin site and the device does not have a default reportable site', () =>
        runTest(async knex => {
          const { now } = context

          const deviceWithNoDefaultReportableSiteId = await knex('Device as d')
            .join('DeviceApiKey as dak', 'dak.deviceId', 'd.id')
            .whereNull('defaultReportableSiteId')
            .first('d.id', 'd.siteId', 'dak.token', 'd.PartnerId', 'd.defaultReportableSiteId')

          const resultPayload = {
            startedOn: now,
            data: { a: 'b' },
            assay: { id: 'GxMtbRif' },
            instrument: { serial: 'Aa123456' },
            sample: {
              id: '493284729-REPORTABLE',
            },
          }
          const response = await server
            .post(devicePath)
            .set('Authorization', `Bearer ${deviceWithNoDefaultReportableSiteId.token}`)
            .send({
              type: {
                id: 'CepheidGeneXpert',
              },
              name: 'Device Name',
              result: resultPayload,
            })
          assert.equal(response.status, 200)
          assert.typeOf(response.body, 'Object')

          const resultId = await getLastResultId(knex, deviceWithNoDefaultReportableSiteId.id)
          if (resultId && !resultIds.includes(resultId)) {
            resultIds.push(resultId)
          }
          const { reportableSiteId: resultReportableSiteId } = await knex('Result as r')
            .where('r.id', resultId)
            .first('r.reportableSiteId')
          assert.equal(resultReportableSiteId, deviceWithNoDefaultReportableSiteId.siteId)
        }))

      it('should be set to the origin site of the result if specified if the device does not have a default reportable site', () =>
        runTest(async knex => {
          const { now } = context

          const deviceWithNoDefaultReportableSiteId = await knex('Device as d')
            .join('DeviceApiKey as dak', 'dak.deviceId', 'd.id')
            .whereNull('defaultReportableSiteId')
            .first('d.id', 'dak.token', 'd.PartnerId', 'd.defaultReportableSiteId')

          const reportableSiteExternalId = 'ReportableSite'
          const reportableSiteId = await createSite(knex, {
            partner: context.partner,
            user: context.user,
            site: reportableSiteExternalId,
          })
          context.siteIds.push(reportableSiteId)

          const resultPayload = {
            startedOn: now,
            data: { a: 'b' },
            assay: { id: 'GxMtbRif' },
            instrument: { serial: 'Aa123456' },
            sample: {
              id: '493284729-REPORTABLE',
              originSite: {
                id: reportableSiteExternalId,
              },
            },
          }
          const response = await server
            .post(devicePath)
            .set('Authorization', `Bearer ${deviceWithNoDefaultReportableSiteId.token}`)
            .send({
              type: {
                id: 'CepheidGeneXpert',
              },
              name: 'Device Name',
              result: resultPayload,
            })
          assert.equal(response.status, 200)
          assert.typeOf(response.body, 'Object')

          const resultId = await getLastResultId(knex, deviceWithNoDefaultReportableSiteId.id)
          if (resultId && !resultIds.includes(resultId)) {
            resultIds.push(resultId)
          }
          const { reportableSiteId: resultReportableSiteId } = await knex('Result as r')
            .where('r.id', resultId)
            .first('r.reportableSiteId')
          assert.equal(resultReportableSiteId, reportableSiteId)
        }))

      it('should be set to the origin site of the result if specified, even if the device has a default reportable site', () =>
        runTest(async knex => {
          const { now } = context

          const deviceWithDefaultReportableSiteId = await knex('Device as d')
            .join('DeviceApiKey as dak', 'dak.deviceId', 'd.id')
            .whereNotNull('defaultReportableSiteId')
            .where('defaultReportableSiteId', '!=', 'siteId')
            .first('d.id', 'dak.token', 'd.PartnerId')

          const reportableSiteExternalId = 'ReportableSite'
          const reportableSiteId = await createSite(knex, {
            partner: context.partner,
            user: context.user,
            site: reportableSiteExternalId,
          })
          context.siteIds.push(reportableSiteId)

          const resultPayload = {
            startedOn: now,
            data: { a: 'b' },
            assay: { id: 'GxMtbRif' },
            instrument: { serial: 'Aa123456' },
            sample: {
              id: '493284729-REPORTABLE',
              originSite: {
                id: reportableSiteExternalId,
              },
            },
          }
          const response = await server
            .post(devicePath)
            .set('Authorization', `Bearer ${deviceWithDefaultReportableSiteId.token}`)
            .send({
              type: {
                id: 'CepheidGeneXpert',
              },
              name: 'Device Name',
              result: resultPayload,
            })
          assert.equal(response.status, 200)
          assert.typeOf(response.body, 'Object')

          const resultId = await getLastResultId(knex, deviceWithDefaultReportableSiteId.id)
          if (resultId && !resultIds.includes(resultId)) {
            resultIds.push(resultId)
          }
          const { reportableSiteId: resultReportableSiteId } = await knex('Result as r')
            .where('r.id', resultId)
            .first('r.reportableSiteId')
          assert.equal(resultReportableSiteId, reportableSiteId)
        }))

      it('should be set to the default reportable site of the device if it has one and the result does not specify', () =>
        runTest(async knex => {
          const { now } = context

          const deviceWithDefaultReportableSiteId = await knex('Device as d')
            .join('DeviceApiKey as dak', 'dak.deviceId', 'd.id')
            .whereNotNull('defaultReportableSiteId')
            .where('defaultReportableSiteId', '!=', 'siteId')
            .first('d.id', 'dak.token', 'd.PartnerId', 'd.defaultReportableSiteId')

          const resultPayload = {
            startedOn: now,
            data: { a: 'b' },
            assay: { id: 'GxMtbRif' },
            instrument: { serial: 'Aa123456' },
            sample: {
              id: '493284729-REPORTABLE',
            },
          }
          const response = await server
            .post(devicePath)
            .set('Authorization', `Bearer ${deviceWithDefaultReportableSiteId.token}`)
            .send({
              type: {
                id: 'CepheidGeneXpert',
              },
              name: 'Device Name',
              result: resultPayload,
            })
          assert.equal(response.status, 200)
          assert.typeOf(response.body, 'Object')

          const resultId = await getLastResultId(knex, deviceWithDefaultReportableSiteId.id)
          if (resultId && !resultIds.includes(resultId)) {
            resultIds.push(resultId)
          }
          const { reportableSiteId: resultReportableSiteId } = await knex('Result as r')
            .where('r.id', resultId)
            .first('r.reportableSiteId')
          assert.equal(resultReportableSiteId, deviceWithDefaultReportableSiteId.defaultReportableSiteId)
        }))
    })

    describe('do not send notification for duplicated result', () => {
      const getResult = async (knex, resultId) => knex('Result as r').where({ id: resultId }).first()

      const postResult = async resultPayload =>
        server
          .post(devicePath)
          .set('Authorization', context.deviceAuth)
          .send({
            type: {
              id: 'CepheidGeneXpert',
            },
            name: 'Device Name',
            result: resultPayload,
          })

      it('should trigger event resultReadyForNotification', () =>
        runTest(async knex => {
          const { now } = context

          const resultPayload = {
            startedOn: now,
            endedOn: addHours(now, 2),
            id: 'test-external-id', // this is `Result.externalId`
            data: { assay: 'Xpert MTB-RIF', a: 'b', b: 'c' },
            assay: { id: 'GxMtbRif' },
            sample: { id: '123-456789-012' },
            instrument: { serial: 'Aa123456' },
          }

          /**
           * insert new result
           */
          let response = await postResult(resultPayload)
          assert.equal(response.status, 200)
          assert.typeOf(response.body, 'Object')
          /**
           * get just insert result and check it's resultDataHash
           */
          let result = await getResult(knex, response.body.aspectResultId)
          const { resultDataHash: prevResultDataHash, id: prevResultId } = result
          assert.typeOf(prevResultDataHash, 'String')
          assert.equal(prevResultDataHash.length, 32)
          /**
           * prepare MQ action to check it was triggered after updating
           * same result with new data
           */
          let action = resultReadyForNotification(result.id, true)
          let waitForResultReadyForNotification = waitForAction(action)
          /**
           * update result
           */
          // change data which then be saved in Result.resultData
          resultPayload.data.b = 'd'
          response = await postResult(resultPayload)
          assert.equal(response.status, 200)
          assert.typeOf(response.body, 'Object')
          // should trigger action to send notification
          await waitForResultReadyForNotification
          await waitForIdle()
          /**
           * compare resultDataHash from previous and updated results
           */
          result = await getResult(knex, response.body.aspectResultId)
          const { resultDataHash: currResultDataHash, id: currResultId } = result
          assert.equal(currResultDataHash.length, 32)
          assert.equal(currResultDataHash !== prevResultDataHash, true)
          /**
           * resultId's are the same because we are updating result with same
           * resultPayload.id='test-external-id' (which is saved to Result.externalId)
           */
          assert.equal(currResultId, prevResultId)
          /**
           * Next - update result with same data - action `RESULT_READY_FOR_NOTIFICATION`
           * should not trigger (awaiting for it will be timeout)
           */
          action = resultReadyForNotification(result.id, true) // isResultUpdated=true
          waitForResultReadyForNotification = waitForAction(action)
          response = await postResult(resultPayload)
          assert.equal(response.status, 200)
          assert.typeOf(response.body, 'Object')
          waitForResultReadyForNotification.catch(ex => {
            assert.equal(ex.message.includes('timeout'), true)
            assert.equal(ex.message.includes(JSON.stringify(action)), true)
          })
          await waitForIdle()

          result = await getResult(knex, response.body.aspectResultId)
          assert.equal(result.resultDataHash.length, 32)
          assert.equal(currResultDataHash, result.resultDataHash)
          assert.equal(currResultId, result.id)
        }))
    })

    describe('fact tables', () => {
      function getFactResultsDevice(knex, deviceId) {
        return knex('FactResultsDevice').where({ deviceId }).select('deviceId', 'days', 'resultCount', 'calculatedOn')
      }

      function getFactResultsDeviceByAssay(knex, deviceId, assayId) {
        return knex('FactResultsDeviceByAssay')
          .where({ deviceId })
          .andWhere({ assayId })
          .select('deviceId', 'assayId', 'days', 'resultCount', 'calculatedOn')
      }

      function getFactResultsDeviceByCategory1(knex, deviceId, assayId, resultCategory1) {
        return knex('FactResultsDeviceByCategory1')
          .where({ deviceId })
          .andWhere({ assayId })
          .andWhere({ resultCategory1 })
          .select('deviceId', 'assayId', 'resultCategory1', 'days', 'resultCount', 'calculatedOn')
      }

      it('should update the result counts in the facts-tables when a new result is reported', () =>
        runTest(async knex => {
          const resultDetails = {
            assayExternalId: 'GxMtbRif',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'MoreThan1000',
            deviceId: context.deviceId,
          }

          const { id: assayId } = await knex('Assay').where('externalId', resultDetails.assayExternalId).first('id')

          const { id: resultCategory1 } = await knex('ResultCategory')
            .where('externalId', resultDetails.resultCategory1ExternalId)
            .first('id')

          await server
            .post(devicePath)
            .set('Authorization', context.deviceAuth)
            .send({
              type: {
                id: 'CepheidGeneXpert',
              },
              result: {
                id: new Date().getTime().toString(), // eslint-disable-line newline-per-chained-call
                data: { a: 'b' },
                assay: { id: resultDetails.assayExternalId },
                category: [
                  { id: resultDetails.resultCategory1ExternalId },
                  { id: resultDetails.resultCategory2ExternalId },
                ],
                endedOn: new Date(),
                instrument: { serial: 'Aa123456' },
              },
            })
            .then(res => {
              assert.equal(res.status, 200)
              return waitAsyncComplete(res)
            })

          const factResultsDeviceBefore = await getFactResultsDevice(knex, context.deviceId)

          const factResultsDeviceByAssayBefore = await getFactResultsDeviceByAssay(knex, context.deviceId, assayId)

          const factResultsDeviceByCategory1Before = await getFactResultsDeviceByCategory1(
            knex,
            context.deviceId,
            assayId,
            resultCategory1
          )

          assert.equal(factResultsDeviceBefore.length, 7, 'There should be one entry per day in the device count table')

          await server
            .post(devicePath)
            .set('Authorization', context.deviceAuth)
            .send({
              type: {
                id: 'CepheidGeneXpert',
              },
              result: {
                id: new Date().getTime().toString(), // eslint-disable-line newline-per-chained-call
                data: { a: 'b' },
                assay: { id: resultDetails.assayExternalId },
                category: [
                  { id: resultDetails.resultCategory1ExternalId },
                  { id: resultDetails.resultCategory2ExternalId },
                ],
                startedOn: new Date(),
                endedOn: addHours(new Date(), 2),
                instrument: { serial: 'Aa123456' },
              },
            })
            .then(res => {
              assert.equal(res.status, 200)
              return waitAsyncComplete(res)
            })

          const factResultsDeviceAfter = await getFactResultsDevice(knex, context.deviceId)

          const factResultsDeviceByAssayAfter = await getFactResultsDeviceByAssay(knex, context.deviceId, assayId)

          const factResultsDeviceByCategory1After = await getFactResultsDeviceByCategory1(
            knex,
            context.deviceId,
            assayId,
            resultCategory1
          )

          factResultsDeviceBefore.forEach(countBefore => {
            const countAfter = _.find(factResultsDeviceAfter, {
              days: countBefore.days,
            })

            // compare before and after counts
            if (countAfter) {
              assert.equal(
                countAfter.resultCount,
                countBefore.resultCount + 1,
                'Count in device fact-table should have increased by one after posting a result'
              )
            }
          })

          factResultsDeviceByAssayBefore.forEach(countBefore => {
            const countAfter = _.find(factResultsDeviceByAssayAfter, {
              days: countBefore.days,
            })

            // compare before and after counts
            if (countAfter) {
              assert.equal(
                countAfter.resultCount,
                countBefore.resultCount + 1,
                'Count in device assay fact-table should have increased by one after posting a result'
              )
            }
          })

          factResultsDeviceByCategory1Before.forEach(countBefore => {
            const countAfter = _.find(factResultsDeviceByCategory1After, {
              days: countBefore.days,
              resultCategory1: countBefore.result1Category1,
            })

            // compare before and after counts
            if (countAfter) {
              assert.equal(
                countAfter.resultCount,
                countBefore.resultCount + 1,
                'Count in device category 1 fact-table should have increased by one after posting a result'
              )
            }
          })
        }))
    })
  })
})
