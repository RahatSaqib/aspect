const chai = require('chai')
const chaiSubset = require('chai-subset')
const _ = require('lodash')
const { addHours } = require('date-fns')
const { knex } = require('../../src/db')
const { resultTypeToId } = require('../../src/shared/dictionary')
const { resultReadyForNotification } = require('../../src/result/actions')

const {
  createTestContext,
  getDeviceConfigurationData,
  getLastDeviceOperationId,
  getLastResultId,
  createSite,
} = require('./utils')

const { waitForIdle, waitForAction } = require('../utils/mqUtils')

const server = require('../utils/testUtils')

const { assert, expect } = chai.use(chaiSubset)

const devicePath = '/device'
const devicePostResultPath = '/device/result'

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
      type: 'DaktariVirology',
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
      await context.createDeviceWithResult()
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
        assert.property(getResultResponse1.body, 'total')
        assert.typeOf(getResultResponse1.body.data, 'array')

        const initialDataLength = getResultResponse1.body.data.length

        let lastResultId = await getLastResultId(knex, deviceId)
        if (lastResultId) {
          resultIds.push(lastResultId)
        }
        const deviceChangedName = `Device Changed Name ${new Date()}`

        const resultPayload = {
          startedOn: now,
          data: { a: 'b' },
          assay: { id: 'DaktariHivVL' },
          instrument: { serial: '1234567' },
          sample: { id: '29347293' },
        }
        const postNewResultResponse1 = await server.post(devicePath).set('Authorization', deviceAuth).send({
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
        assert.property(getResultResponse2.body, 'total')
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
        assert.deepEqual(JSON.parse(result1.resultData), { a: 'b' })

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

        assert.equal(result1Assay.externalId, 'DaktariHivVL')
        assert.equal(result1Assay.name, 'Daktari HIV-VL')

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
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            data: { a: 'b', c: 2, d: false, e: { f: 'g' } },
            type: { id: 'Study' },
            source: { id: 'EnteredByHand' },
            category: [{ id: 'Detected' }, { id: 'Indeterminate' }],
            assay: {
              id: 'DaktariHivVL',
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
            location: {
              longitude: -87.581222,
              latitude: 30.419348,
            },
            startedOn: '2013-12-01',
            endedOn: '2013-12-01T01:30:00.000Z',
            consumable: {
              serial: '132-44-222',
              expirationDate: '2014-03-01',
              lot: '331',
            },
            instrument: {
              serial: '444-3',
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
              location: {
                longitude: -87.581222,
                latitude: 30.419348,
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
        assert.property(getResultResponse3.body, 'total')

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
          a: 'b',
          c: 2,
          d: false,
          e: { f: 'g' },
        })
        assert.equal(result2.assayVersion, '1a.c1')
        assert.approximately(result2.latitude, 30.419348, 0.000001)
        assert.approximately(result2.longitude, -87.581222, 0.000001)
        assert.deepEqual(result2.startedOn, new Date('2013-12-01'))
        assert.deepEqual(result2.endedOn, new Date('2013-12-01T01:30:00.000Z'))
        assert.equal(result2.sampleGroup, 'Sample Group X-1')
        assert.equal(result2.sampleRunNumber, '10z')
        assert.equal(result2.consumableSerial, '132-44-222')
        assert.deepEqual(result2.consumableExpirationDate, new Date('2014-03-01'))
        assert.equal(result2.consumableLot, '331')
        assert.equal(result2.instrumentSerial, '444-3')
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
          phone: '856-7909',
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
          location: {
            longitude: -87.581222,
            latitude: 30.419348,
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
        assert.equal(result2Assay.externalId, 'DaktariHivVL')
        assert.equal(result2Assay.name, 'Daktari HIV-VL')

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

        assert.deepEqual(JSON.parse(log2Raw), {
          data: { a: 'b', c: 2, d: false, e: { f: 'g' } },
          type: { id: 'Study' },
          source: { id: 'EnteredByHand' },
          category: [{ id: 'Detected' }, { id: 'Indeterminate' }],
          assay: {
            id: 'DaktariHivVL',
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
          location: {
            longitude: -87.581222,
            latitude: 30.419348,
          },
          startedOn: '2013-12-01',
          endedOn: '2013-12-01T01:30:00.000Z',
          consumable: {
            serial: '132-44-222',
            expirationDate: '2014-03-01',
            lot: '331',
          },
          instrument: {
            serial: '444-3',
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
            location: {
              longitude: -87.581222,
              latitude: 30.419348,
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
        })
        const getResultResponse4 = await server.get(clientSingleResultPath + resultId2).set('Authorization', clientAuth)

        assert.equal(getResultResponse4.status, 200)
        assert.typeOf(getResultResponse4.body, 'Object')
        assert.typeOf(getResultResponse4.body.data, 'Object')
        assert.typeOf(getResultResponse4.body.data.resultData, 'Object')
        assert.deepEqual(getResultResponse4.body.data.resultData, {
          a: 'b',
          c: 2,
          d: false,
          e: { f: 'g' },
        })

        const postNewResultResponse4 = await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({ name: deviceChangedName })

        assert.equal(postNewResultResponse4.status, 200)
        assert.typeOf(postNewResultResponse4.body, 'Object')

        const getResultResponse5 = await server.get(`${devicePath}`).set('Authorization', deviceAuth)

        assert.equal(getResultResponse5.status, 200)
        assert.typeOf(getResultResponse5.body, 'Object')
        // The device shouldn't change its name
        assert.notEqual(getResultResponse5.body.name, deviceChangedName)
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
        assert.property(getResultResponse1.body, 'total')
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
          data: { a: 'b' },
          assay: { id: 'DaktariHivVl' },
          instrument: { serial: '9879879' },
          sample: {
            id: '493284729',
            originSite: {
              id: existingSiteExternalId,
            },
          },
        }
        const postNewResultResponse = await server.post(devicePath).set('Authorization', deviceAuth).send({
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
          location: {
            latitude: expectedSampleOriginSite.latitude,
            longitude: expectedSampleOriginSite.longitude,
          },
          timezoneId: expectedSampleOriginSite.timezoneid,
          hoursStart: expectedSampleOriginSite.hoursStart,
          hoursEnd: expectedSampleOriginSite.hoursEnd,
        }
        await server.post(devicePath).set('Authorization', deviceAuth).send({
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
          assay: { id: 'DaktariHivVL' },
          instrument: { serial: '1234567' },
          sample: { id: '76543789' },
        }
        await server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send(resultPayload)
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
          assay: { id: 'DaktariHivVL' },
          instrument: { serial: '1234567' },
          sample: { id: '76543788' },
        }
        await server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send(resultErrorPayload)
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
          assay: { id: 'DaktariHivVL' },
          instrument: { serial: '1234567' },
          sample: { id: '76543787' },
        }
        await server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send(resultInvalidErrorPayload)
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
          assay: { id: 'DaktariHivVL' },
          instrument: { serial: '1234567' },
          sample: { id: '76543786' },
        }
        await server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send(resultDetectedNotDetectedPayload)
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
          assay: { id: 'DaktariHivVL' },
          instrument: { serial: '1234567' },
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
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send(resultPayload)
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
          assay: { id: 'DaktariHivVL' },
          instrument: { serial: '1234567' },
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
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send(resultPayload)
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
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            id: resultExternalIds[0],
            startedOn: now,
            data: { a: 'b' },
            assay: { id: 'DaktariHivVL' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        resultIds.push(await getLastResultId(knex, deviceId))

        let result1 = await knex('Result as r').where({ id: resultIds[0] }).first()
        assert.equal(result1.externalId, resultExternalIds[0])
        assert.deepEqual(JSON.parse(result1.resultData), { a: 'b' })
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
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            id: resultExternalIds[0],
            startedOn: now.toISOString(),
            data: { a: 'b', c: 'd' },
            assay: { id: 'DaktariHivVL' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })

        let lastResultId = await getLastResultId(knex, deviceId)
        assert.equal(lastResultId, resultIds[0])

        result1 = await knex('Result as r').where({ id: resultIds[0] }).first()
        assert.equal(result1.externalId, resultExternalIds[0])
        assert.deepEqual(JSON.parse(result1.resultData), { a: 'b', c: 'd' })
        assert.isNotOk(result1.errorCode)
        assert.equal(initialCount + 1, await countResults(), 'Result count does not match')

        await server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            id: resultExternalIds[1],
            startedOn: now.toISOString,
            data: { a: 'b' },
            assay: { id: 'DaktariHivVL' },
            sample: {
              id: mobileSampleExternalId,
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })

        lastResultId = await getLastResultId(knex, deviceId)
        assert.notEqual(lastResultId, resultIds[0])
        resultIds.push(lastResultId)

        let result2 = await knex('Result as r').where({ id: resultIds[1] }).first()
        assert.equal(result2.externalId, resultExternalIds[1])
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
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            id: resultExternalIds[1],
            data: { a: 'b', c: 2, d: false, e: { f: 'g' } },
            type: { id: 'Study' },
            source: { id: 'EnteredByHand' },
            category: [{ id: 'Detected' }, { id: 'Indeterminate' }],
            assay: {
              id: 'DaktariHivVL',
              version: '1a.c1',
            },
            sample: {
              id: `Sample${now}`,
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
            startedOn: '2013-12-01',
            endedOn: '2013-12-01T01:30:00.000Z',
            consumable: {
              serial: '132-44-222',
              expirationDate: '2014-03-01',
              lot: '331',
            },
            instrument: {
              serial: '444-3',
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
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        lastResultId = await getLastResultId(knex, deviceId)
        assert.equal(lastResultId, resultIds[1])

        result2 = await knex('Result as r').where({ id: resultIds[1] }).first()
        assert.equal(initialCount + 2, await countResults())
        assert.equal(result2.externalId, resultExternalIds[1])
        expect(JSON.parse(result2.resultData)).to.containSubset({
          a: 'b',
          c: 2,
          d: false,
          e: { f: 'g' },
        })
        assert.equal(result2.assayVersion, '1a.c1')
        assert.approximately(result2.latitude, 30.419348, 0.000001)
        assert.approximately(result2.longitude, -87.581222, 0.000001)
        assert.deepEqual(result2.startedOn, new Date('2013-12-01'))
        assert.deepEqual(result2.endedOn, new Date('2013-12-01T01:30:00.000Z'))
        assert.equal(result2.consumableSerial, '132-44-222')
        assert.deepEqual(result2.consumableExpirationDate, new Date('2014-03-01'))
        assert.equal(result2.consumableLot, '331')
        assert.equal(result2.instrumentSerial, '444-3')
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
          phone: '856-7909',
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
        assert.equal(result2Assay.externalId, 'DaktariHivVL')
        assert.equal(result2Assay.name, 'Daktari HIV-VL')

        const result2Sample = await knex('Sample as s').where({ id: result2.sampleId }).first()

        assert.notEqual(
          result2.siteId,
          result2Sample.originSiteId,
          'Sample origin site Id should change on result updates if the sample was not registered in the mobile app'
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
        assert.equal(result2Sample.externalId, `Sample${now}`)

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
        const opIds = []

        const [{ count: initialLogLength }] = await knex('DeviceLog').count('id as count')

        await server
          .get(devicePath)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200) // there isn't any for this device
            assert.typeOf(res.body.result, 'undefined')
          })

        const res = await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            configuration: { data: { a: 'b' } },
            operation: { data: { a: 'c' } },
            result: {
              startedOn: now,
              data: {
                a: 'd',
              },
              instrument: {
                serial: 'A NICE INSTRUMENT SERIAL',
              },
              assay: { id: 'DaktariHivVL' },
            },
          })
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')

        // The last reported instrument serial should be updated in the device table
        const { lastInstrumentSerial } = await knex('Device').where({ id: deviceId }).first()
        assert.equal(lastInstrumentSerial, 'A NICE INSTRUMENT SERIAL')

        resultIds.push(await getLastResultId(knex, deviceId))
        opIds.push(await getLastDeviceOperationId(knex, deviceId))

        const [{ count: logLength2 }] = await knex('DeviceLog').count('id as count')
        assert.equal(logLength2, initialLogLength + 1) // I add new devicelog for the current device

        const deviceLogResult2 = await knex('Result')
          .where({ id: resultIds[resultIds.length - 1] })
          .first()
        const deviceLogConfig2 = await getDeviceConfigurationData(knex, deviceId)
        const deviceLogOp2 = await knex('DeviceOperation')
          .where({ id: opIds[opIds.length - 1] })
          .first()
        assert.deepEqual(deviceLogConfig2, _.assign({}, baseConfig, { a: 'b' }))
        assert.property(deviceLogOp2, 'data')
        assert.deepEqual(JSON.parse(deviceLogOp2.data), { a: 'c' })
        assert.property(deviceLogResult2, 'resultData')
        assert.deepEqual(JSON.parse(deviceLogResult2.resultData), { a: 'd' })
        const deviceLogUpdates2 = await knex('DeviceLog').where({
          deviceConfigurationUpdated: true,
          deviceOperationId: deviceLogOp2.id,
        })

        assert.equal(deviceLogUpdates2.length, 1)
        assert.isOk(deviceLogUpdates2[0].id)
        assert.equal(deviceLogUpdates2[0].resultId, deviceLogResult2.id)

        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            configuration: { data: { a: 'c' } },
            operation: { data: { a: 'd' } },
            result: {
              startedOn: now,
              data: { a: 'd' },
              assay: { id: 'DaktariHivVL' },
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        resultIds.push(await getLastResultId(knex, deviceId))
        opIds.push(await getLastDeviceOperationId(knex, deviceId))

        const deviceLogConfig3 = await getDeviceConfigurationData(knex, deviceId)
        const deviceLogOp3 = await knex('DeviceOperation')
          .where({ id: opIds[opIds.length - 1] })
          .first()

        assert.deepEqual(deviceLogConfig3, _.assign({}, baseConfig, { a: 'c' }))
        assert.property(deviceLogOp3, 'data')
        assert.deepEqual(JSON.parse(deviceLogOp3.data), { a: 'd' })

        const deviceLogUpdates3 = await knex('DeviceLog').where({
          deviceConfigurationUpdated: true,
          deviceOperationId: deviceLogOp3.id,
        })

        assert.equal(deviceLogUpdates3.length, 1)
        assert.isOk(deviceLogUpdates3[0].id)
        assert.isOk(deviceLogUpdates3[0].resultId)
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
            assay: { id: 'DaktariHivVl' },
            instrument: { serial: '9879879' },
            sample: {
              id: '493284729-REPORTABLE',
            },
          }
          const response = await server
            .post(devicePath)
            .set('Authorization', `Bearer ${deviceWithNoDefaultReportableSiteId.token}`)
            .send({
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
            assay: { id: 'DaktariHivVl' },
            instrument: { serial: '9879879' },
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
            assay: { id: 'DaktariHivVl' },
            instrument: { serial: '9879879' },
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
            assay: { id: 'DaktariHivVl' },
            instrument: { serial: '9879879' },
            sample: {
              id: '493284729-REPORTABLE',
            },
          }
          const response = await server
            .post(devicePath)
            .set('Authorization', `Bearer ${deviceWithDefaultReportableSiteId.token}`)
            .send({
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
        server.post(devicePath).set('Authorization', context.deviceAuth).send({
          name: 'Device Name',
          result: resultPayload,
        })

      it('should trigger event resultReadyForNotification', () =>
        runTest(async knex => {
          const { now, deviceId } = context

          const resultPayload = {
            startedOn: now,
            endedOn: addHours(now, 2),
            id: 'test-external-id', // this is `Result.externalId`
            data: { a: 'b', b: 'c' },
            assay: { id: 'DaktariHivVl' },
            deviceId,
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
          let action = resultReadyForNotification(result.id)
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
            assayExternalId: 'DaktariHivVL',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'MoreThan1000',
            deviceId: context.deviceId,
          }

          const { id: assayId } = await knex('Assay').where('externalId', resultDetails.assayExternalId).first('id')

          const { id: resultCategory1 } = await knex('ResultCategory')
            .where('externalId', resultDetails.resultCategory1ExternalId)
            .first('id')

          await server
            .post(devicePostResultPath)
            .set('Authorization', context.deviceAuth)
            .send({
              id: new Date().getTime().toString(), // eslint-disable-line newline-per-chained-call
              data: { a: 'b' },
              assay: { id: resultDetails.assayExternalId },
              category: [
                { id: resultDetails.resultCategory1ExternalId },
                { id: resultDetails.resultCategory2ExternalId },
              ],
              endedOn: new Date(),
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
            .post(devicePostResultPath)
            .set('Authorization', context.deviceAuth)
            .send({
              id: new Date().getTime().toString(), // eslint-disable-line newline-per-chained-call
              data: { a: 'b' },
              assay: { id: resultDetails.assayExternalId },
              category: [
                { id: resultDetails.resultCategory1ExternalId },
                { id: resultDetails.resultCategory2ExternalId },
              ],
              startedOn: new Date(),
              endedOn: addHours(new Date(), 2),
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
