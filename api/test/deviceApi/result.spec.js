const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const { subDays, addDays, startOfDay } = require('date-fns')
const { parseDateOrDefault } = require('../../src/shared/date')
const { getResult } = require('../../src/deviceApi/result')
const {
  createTestContext,
  getDeviceConfigurationData,
  getLastDeviceOperationId,
  getLastResultId,
} = require('./utils')

const { waitForIdle } = require('../utils/mqUtils')

const server = supertest.agent('http://localhost:8080')
const { assert, expect } = chai

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
    return new Promise(resolve =>
      setTimeout(resolve, ASYNC_TEST_ACCEPTANCE_TIME)
    )
      .then(waitForIdle)
      .then(() => result)
  }

  const clientBasePath = '/api/result'
  function setResultAsDeliverable(
    context,
    resultId,
    changedOn,
    testStatus = true
  ) {
    const { clientAuth } = context
    const status = { externalId: 'Deliverable' }
    if (changedOn) status.updatedOn = changedOn.toISOString()
    const clientSingleResultPath = `${clientBasePath}/`
    return server
      .put(`${clientSingleResultPath}workflow-status/${resultId}`)
      .send(status)
      .set('Authorization', clientAuth)
      .then(res => {
        assert.equal(
          res.status,
          200,
          res && res.body && res.body.message ? res.body.message : ''
        )
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'Object')
        if (testStatus)
          assert.equal(res.body.data.resultWorkflowStatus, 'Ready for delivery')
        return res
      })
  }

  function approveResult(context, resultId) {
    const { clientAuth } = context
    const clientSingleResultPath = `${clientBasePath}/`
    return server
      .put(`${clientSingleResultPath}qc-check/${resultId}`)
      .send({ qcCheck: true })
      .set('Authorization', clientAuth)
      .then(res => {
        assert.equal(
          res.status,
          200,
          res && res.body && res.body.message ? res.body.message : ''
        )
        return waitAsyncComplete(res)
      })
  }

  function setResultAsDeliverableAndApprove(context, resultId) {
    return setResultAsDeliverable(context, resultId).then(() =>
      approveResult(context, resultId)
    )
  }

  describe('admin result updates', () => {
    const context = createTestContext(server, {
      user: 'admin',
      type: 'DaktariVirology',
      partner: 'Partner One',
      baseConfig,
    })

    const { runTest } = context

    beforeEach(async () => {
      await context.createDeviceWithResult()
    })
    afterEach(context.afterEach)

    it('should add and return device results', () =>
      runTest(async knex => {
        const resultIds = []
        const { deviceId, clientAuth, deviceAuth, now } = context
        const clientSingleResultPath = `${clientBasePath}/`
        const clientPath = `${clientBasePath}?deviceId=${deviceId}&size=1000`

        let initialDataLength = 0
        const [{ count: initialLogLength }] = await knex('DeviceLog').count(
          'id as count'
        )

        await server
          .get(clientPath)
          .set('Authorization', clientAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'array')
            assert.isAtLeast(res.body.data.length, 0)
            initialDataLength = res.body.data.length
            assert.property(res.body, 'total')
          })

        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({ checkpoint: 'ck0' })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        let deviceFirstName
        const deviceChangedName = `Device Changed Name ${now}`
        await server
          .get(`${devicePath}?checkpoint=ck0`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.typeOf(res.body.name, 'string')
            assert.equal(res.body.checkpoint, 'ck0')
            deviceFirstName = res.body.name
          })

        const resultPayload = {
          startedOn: now,
          data: { a: 'b' },
          assay: { id: 'DaktariHivVl' },
          instrument: { serial: '1234567' },
          sample: { id: '76543789' },
        }
        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            name: deviceChangedName,
            checkpoint: 'ck1',
            result: resultPayload,
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        resultIds.push(await getLastResultId(knex, deviceId))

        const [{ count: logLength1 }] = await knex('DeviceLog').count(
          'id as count'
        )

        assert.equal(logLength1, initialLogLength + 2) // checkpoint + post

        await server
          .get(clientPath)
          .set('Authorization', clientAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'array')
            assert.property(res.body, 'total')

            assert.equal(res.body.data.length, initialDataLength + 1)
            const lastResult = _.find(res.body.data, { id: resultIds[0] })
            assert.typeOf(lastResult, 'Object')
            assert.equal(lastResult.id, resultIds[0])
          })

        const result1 = await knex('Result as r')
          .where({ id: resultIds[0] })
          .first()

        const tagsResult1 = await knex('Result as r')
          .join('ResultTag as rt', 'r.id', 'rt.resultId')
          .join('Tag as t', 'rt.tagid', 't.id')
          .where({ 'r.id': resultIds[0] })
          .select('t.*')

        assert.equal(tagsResult1.length, 0)
        assert.deepEqual(JSON.parse(result1.resultData), { a: 'b' })

        const result1Type = await knex('ResultType as rt')
          .where({ id: result1.resultTypeId })
          .first('externalId')

        assert.equal(result1Type.externalId, 'Patient')

        const result1Source = await knex('ResultSource as rs')
          .where({ id: result1.resultSourceId })
          .first('externalId')

        assert.equal(result1Source.externalId, 'DiagnosticDevice')

        const result1Status = await knex('ResultWorkflowLog as rsl')
          .join(
            'ResultWorkflowStatus as rs',
            'rsl.resultWorkflowStatusId',
            'rs.id'
          )
          .where('rsl.id', result1.resultWorkflowStatusLogId)
          .first('rs.externalId')

        assert.equal(result1Status.externalId, 'OK')

        const result1Sample = await knex('Sample as s')
          .where({ id: result1.sampleId })
          .first()

        assert.equal(result1.siteId, result1Sample.originSiteId)
        assert.equal(result1Sample.collectedOn, null)
        assert.equal(result1Sample.sampleTypeId, null)

        const result1SampleSite = await knex('Site as s')
          .where({ id: result1Sample.originSiteId })
          .first()

        assert.equal(result1.siteId, result1Sample.originSiteId)

        const result1Assay = await knex('Assay as assay')
          .where({ id: result1.assayId })
          .first('externalId', 'name')

        assert.equal(result1Assay.externalId, 'DaktariHivVl')
        assert.equal(result1Assay.name, 'Daktari HIV-VL')

        const [result1Category1, result1Category2] = await knex(
          'ResultCategory as rt'
        )
          .whereIn('id', [result1.resultCategory1, result1.resultCategory2])
          .select('externalId')

        assert.equal(result1Category1.externalId, 'Success')
        assert.isNotOk(result1Category2)

        const [{ rawMessage: log1Raw, resultId: resultId1 }] = await knex(
          'DeviceLog as dl'
        )
          .innerJoin('Result as r', 'r.id', 'dl.resultId')
          .where({ 'r.id': resultIds[0] })
          .select('rawMessage', 'resultId')

        assert.deepEqual(JSON.parse(log1Raw), {
          name: deviceChangedName,
          checkpoint: 'ck1',
          result: {
            data: resultPayload.data,
            assay: resultPayload.assay,
            instrument: resultPayload.instrument,
            sample: resultPayload.sample,
            startedOn: resultPayload.startedOn.toISOString(),
          },
        })

        await server
          .get(`${clientSingleResultPath}${resultId1}`)
          .set('Authorization', clientAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.typeOf(res.body.data, 'Object')
            assert.typeOf(res.body.data.resultData, 'Object')
            assert.deepEqual(res.body.data.resultData, { a: 'b' })
          })

        const { checkpoint: checkpoint1 } = await knex('DeviceLog')
          .where({ deviceId })
          .orderBy('id', 'desc')
          .first('checkpoint')

        assert.equal(checkpoint1, 'ck1')

        await server
          .get(`${devicePath}?checkpoint=ck0`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.equal(res.body.checkpoint, 'ck0')
            assert.typeOf(res.body.result, 'undefined')
          })

        await setResultAsDeliverableAndApprove(context, resultId1)

        await server
          .get(`${devicePath}?checkpoint=ck1`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.equal(res.body.checkpoint, 'ck1')
            assert.equal(res.body.name, deviceChangedName)
            assert.typeOf(res.body.result, 'Object')

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(
              lastResult.sample.originSite.id,
              result1SampleSite.externalId
            )
            assert.typeOf(lastResult.workflow, 'Object')
            assert.typeOf(lastResult.workflow.status, 'Object')
            assert.property(lastResult.workflow, 'changedOn')

            expect(lastResult).to.containSubset({
              data: resultPayload.data,
              assay: resultPayload.assay,
              category: [{ id: 'Success' }],
              type: { id: 'Patient' },
              source: { id: 'DiagnosticDevice' },
              instrument: resultPayload.instrument,
            })
          })

        const result2SampleSite = await knex('Site as s')
          .where('partnerId', result1SampleSite.partnerId)
          .where('id', '<>', result1.siteId)
          .first()

        await server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            checkpoint: 'ck2',
            data: { a: 'b', c: 2, d: false, e: { f: 'g' } },
            type: { id: 'Study' },
            source: { id: 'EnteredByHand' },
            workflow: {
              status: { id: 'Acknowledged' },
              operator: 'Goody Two Shoes',
              changedOn: '2013-12-01T01:35',
            },
            category: [{ id: 'Detected' }, { id: 'Indeterminate' }],
            assay: {
              id: 'DaktariHivVl',
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
              lot: '331-1',
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
            notes: 'My Awesome notes about this Awesome result!, 123-12',
            error: {
              code: '123',
              notes: 'Oh NOZE!',
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        resultIds.push(await getLastResultId(knex, deviceId))

        const { checkpoint: checkpoint2 } = await knex('DeviceLog')
          .where({ deviceId })
          .orderBy('id', 'desc')
          .first('checkpoint')
        assert.equal(checkpoint2, 'ck2')
        const [{ count: logLength2 }] = await knex('DeviceLog').count(
          'id as count'
        )

        assert.equal(logLength2, initialLogLength + 4)

        await server
          .get(clientPath)
          .set('Authorization', clientAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'array')
            assert.property(res.body, 'total')

            assert.equal(res.body.data.length, initialDataLength + 2)
          })

        const result2 = await knex('Result as r')
          .where({ 'r.id': resultIds[1] })
          .first()
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
        assert.deepEqual(
          result2.consumableExpirationDate,
          new Date('2014-03-01')
        )
        assert.equal(result2.consumableLot, '331-1')
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
        assert.equal(
          result2.notes,
          'My Awesome notes about this Awesome result!, 123-12'
        )
        assert.equal(result2.errorCode, '123')
        assert.equal(result2.errorNotes, 'Oh NOZE!')

        const result2Type = await knex('ResultType as rt')
          .where({ id: result2.resultTypeId })
          .first('externalId')
        assert.equal(result2Type.externalId, 'Study')

        const result2Source = await knex('ResultSource as rs')
          .where({ id: result2.resultSourceId })
          .first('externalId')
        assert.equal(result2Source.externalId, 'EnteredByHand')

        const result2Status = await knex('ResultWorkflowLog as rsl')
          .join(
            'ResultWorkflowStatus as rs',
            'rsl.resultWorkflowStatusId',
            'rs.id'
          )
          .where('rsl.id', result2.resultWorkflowStatusLogId)
          .first('externalId')
        assert.equal(result2Status.externalId, 'Acknowledged')

        const result2Assay = await knex('Assay as assay')
          .where({ id: result2.assayId })
          .first('externalId', 'name')
        assert.equal(result2Assay.externalId, 'DaktariHivVl')
        assert.equal(result2Assay.name, 'Daktari HIV-VL')

        const result2Sample = await knex('Sample as s')
          .where({ id: result2.sampleId })
          .first()
        assert.notEqual(result2.siteId, result2Sample.originSiteId)
        assert.equal(result2SampleSite.id, result2Sample.originSiteId)
        assert.equal(result2Sample.externalId, `Sample${now}`)

        const [result2Category1, result2Category2] = await knex(
          'ResultCategory as rt'
        )
          .whereIn('id', [result2.resultCategory1, result2.resultCategory2])
          .select('externalId')
        assert.equal(result2Category1.externalId, 'Detected')
        assert.equal(result2Category2.externalId, 'Indeterminate')

        const [{ rawMessage: log2Raw, resultId: resultId2 }] = await knex(
          'DeviceLog as dl'
        )
          .innerJoin('Result as r', 'r.id', 'dl.resultId')
          .where({ 'r.id': resultIds[1] })
          .select('rawMessage', 'resultId')

        assert.deepEqual(JSON.parse(log2Raw), {
          checkpoint: 'ck2',
          data: { a: 'b', c: 2, d: false, e: { f: 'g' } },
          type: { id: 'Study' },
          source: { id: 'EnteredByHand' },
          workflow: {
            status: { id: 'Acknowledged' },
            operator: 'Goody Two Shoes',
            changedOn: '2013-12-01T01:35',
          },
          category: [{ id: 'Detected' }, { id: 'Indeterminate' }],
          assay: {
            id: 'DaktariHivVl',
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
            lot: '331-1',
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
          notes: 'My Awesome notes about this Awesome result!, 123-12',
          error: {
            code: '123',
            notes: 'Oh NOZE!',
          },
        })
        await server
          .get(clientSingleResultPath + resultId2)
          .set('Authorization', clientAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.typeOf(res.body.data, 'Object')
            assert.typeOf(res.body.data.resultData, 'Object')
            assert.deepEqual(res.body.data.resultData, {
              a: 'b',
              c: 2,
              d: false,
              e: { f: 'g' },
            })
          })

        await server
          .get(`${devicePath}?checkpoint=ck1`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.equal(res.body.checkpoint, 'ck1')
            assert.typeOf(res.body.result, 'Object')
          })

        await setResultAsDeliverableAndApprove(context, resultId2)

        await server
          .get(`${devicePath}?checkpoint=ck2`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'object')
            assert.equal(res.body.checkpoint, 'ck2')
            assert.typeOf(res.body.result, 'Object')

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.property(lastResult, 'endedOn')
            assert.property(lastResult.sample, 'id')
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(
              lastResult.sample.originSite.id,
              result2SampleSite.externalId
            )
            assert.property(lastResult, 'location')
            assert.approximately(
              lastResult.location.latitude,
              30.419348,
              0.000001
            )
            assert.approximately(
              lastResult.location.longitude,
              -87.581222,
              0.000001
            )
            assert.equal(lastResult.workflow.status.id, 'Deliverable')
            expect(lastResult).to.containSubset({
              data: { a: 'b', c: 2, d: false, e: { f: 'g' } },
              assay: {
                id: 'DaktariHivVl',
                version: '1a.c1',
              },
              type: { id: 'Study' },
              source: { id: 'EnteredByHand' },
              category: [{ id: 'Detected' }, { id: 'Indeterminate' }],
              sample: {
                id: `Sample${now}`,
                runNumber: '10z',
                group: 'Sample Group X-1',
                collectedOn: '2013-11-25T00:00:00.000Z',
                type: {
                  id: 'DBS',
                },
                originSite: {
                  id: result2SampleSite.externalId,
                },
              },
              startedOn: '2013-12-01T00:00:00.000Z',
              endedOn: '2013-12-01T01:30:00.000Z',
              consumable: [
                {
                  serial: '132-44-222',
                  expirationDate: '2014-03-01T00:00:00.000Z',
                  lot: '331-1',
                },
              ],
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
                dateOfBirth: '1903-05-29T00:00:00.000Z',
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
              notes: 'My Awesome notes about this Awesome result!, 123-12',
              error: {
                code: '123',
                notes: 'Oh NOZE!',
              },
            })
          })

        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({ name: deviceFirstName })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        await server
          .get(`${devicePath}`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.equal(res.body.name, deviceFirstName)
          })
      }))

    it('should set result status with different updatedOn parameters', () =>
      runTest(async knex => {
        const resultIds = []
        const { deviceId, deviceAuth, now } = context

        const resultPayload = {
          startedOn: now,
          checkpoint: '3123',
          data: { a: 'b' },
          assay: { id: 'DaktariHivVl' },
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

        await setResultAsDeliverable(
          context,
          _.last(resultIds),
          new Date(2010, 1, 1),
          false
        )

        const result1 = await knex('Result as r')
          .where({ id: _.last(resultIds) })
          .first()

        const result1Status = await knex('ResultWorkflowLog as rsl')
          .innerJoin(
            'ResultWorkflowStatus as rs',
            'rsl.resultWorkflowStatusId',
            'rs.Id'
          )
          .where('rsl.id', result1.resultWorkflowStatusLogId)
          .first('externalId')

        assert.equal(result1Status.externalId, 'OK')

        const now2 = new Date()
        await setResultAsDeliverable(
          context,
          _.last(resultIds),
          new Date(now2.setMinutes(now2.getMinutes() + 30))
        )

        const result2 = await knex('Result as r')
          .where({ id: _.last(resultIds) })
          .first()

        const result2Status = await await knex('ResultWorkflowLog as rsl')
          .innerJoin(
            'ResultWorkflowStatus as rs',
            'rsl.resultWorkflowStatusId',
            'rs.Id'
          )
          .where('rsl.id', result2.resultWorkflowStatusLogId)
          .first('externalId')

        assert.equal(result2Status.externalId, 'Deliverable')
      }))

    it('should set default result status and categories', () =>
      runTest(async knex => {
        const resultIds = []
        const { deviceId, deviceAuth, now } = context

        const resultPayload = {
          startedOn: now,
          checkpoint: '3123',
          data: { a: 'b' },
          assay: { id: 'DaktariHivVl' },
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

        await setResultAsDeliverableAndApprove(context, _.last(resultIds))

        await server
          .get(`${devicePath}?checkpoint=3123`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.typeOf(res.body.result, 'Object')
            assert.deepEqual(res.body.result.data, { a: 'b' })
          })

        const result1 = await knex('Result as r')
          .where({ id: resultIds[0] })
          .first()

        assert.deepEqual(JSON.parse(result1.resultData), { a: 'b' })
        assert.isNotOk(result1.errorCode)

        const result1Status = await knex('ResultWorkflowLog as rsl')
          .innerJoin(
            'ResultWorkflowStatus as rs',
            'rsl.resultWorkflowStatusId',
            'rs.Id'
          )
          .where('rsl.id', result1.resultWorkflowStatusLogId)
          .first('externalId')

        assert.equal(result1Status.externalId, 'Deliverable')

        const [result1Category1, result1Category2] = await knex(
          'ResultCategory as rt'
        )
          .whereIn('id', [result1.resultCategory1, result1.resultCategory2])
          .select('externalId')
        assert.equal(result1Category1.externalId, 'Success')
        assert.isNotOk(result1Category2)

        const resultErrorPayload = {
          startedOn: now,
          checkpoint: '312',
          data: { a: 'c' },
          error: { code: '1' },
          assay: { id: 'DaktariHivVl' },
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

        await setResultAsDeliverableAndApprove(context, _.last(resultIds))

        await server
          .get(`${devicePath}?checkpoint=312`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.typeOf(res.body.result, 'Object')
            assert.deepEqual(res.body.result.data, { a: 'c' })
            assert.deepEqual(res.body.result.error.code, '1')
          })

        const result2 = await knex('Result as r')
          .where({ id: resultIds[1] })
          .first()

        assert.deepEqual(JSON.parse(result2.resultData), { a: 'c' })
        assert.equal(result2.errorCode, '1')

        const result2Status = await await knex('ResultWorkflowLog as rsl')
          .innerJoin(
            'ResultWorkflowStatus as rs',
            'rsl.resultWorkflowStatusId',
            'rs.Id'
          )
          .where('rsl.id', result2.resultWorkflowStatusLogId)
          .first('externalId')

        assert.equal(result2Status.externalId, 'Deliverable')

        const [result2Category1, result2Category2] = await knex(
          'ResultCategory as rt'
        )
          .whereIn('id', [result2.resultCategory1, result2.resultCategory2])
          .select('externalId')
        assert.equal(result2Category1.externalId, 'Error')
        assert.isNotOk(result2Category2)

        const resultInvalidErrorPayload = {
          startedOn: now,
          data: { a: 'd' },
          category: { id: 'Invalid' },
          error: { code: '1' },
          assay: { id: 'DaktariHivVl' },
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

        const result3 = await knex('Result as r')
          .where({ id: resultIds[2] })
          .first()
        assert.deepEqual(JSON.parse(result3.resultData), { a: 'd' })
        assert.equal(result3.errorCode, '1')

        const result3Status = await knex('ResultWorkflowLog as rsl')
          .innerJoin(
            'ResultWorkflowStatus as rs',
            'rsl.resultWorkflowStatusId',
            'rs.Id'
          )
          .where('rsl.id', result3.resultWorkflowStatusLogId)
          .first('externalId')
        assert.equal(result3Status.externalId, 'Error')

        const [result3Category1, result3Category2] = await knex(
          'ResultCategory as rt'
        )
          .whereIn('id', [result3.resultCategory1, result3.resultCategory2])
          .select('externalId')
        assert.equal(result3Category1.externalId, 'Invalid')
        assert.isNotOk(result3Category2)

        const resultDetectedNotDetectedPayload = {
          startedOn: now,
          checkpoint: '31',
          data: { a: 'e' },
          category: [{ id: 'Detected' }, { id: 'NotDetected' }],
          assay: { id: 'DaktariHivVl' },
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

        await setResultAsDeliverableAndApprove(context, _.last(resultIds))

        await server
          .get(`${devicePath}?checkpoint=31`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.typeOf(res.body.result, 'Object')
            assert.deepEqual(res.body.result.data, { a: 'e' })
            assert.deepEqual(res.body.result.category, [
              { id: 'Detected' },
              { id: 'NotDetected' },
            ])
          })

        const result4 = await knex('Result as r')
          .where({ id: resultIds[3] })
          .first()
        assert.deepEqual(JSON.parse(result4.resultData), { a: 'e' })
        assert.isNotOk(result4.errorCode)

        const result4Status = await knex('ResultWorkflowLog as rsl')
          .innerJoin(
            'ResultWorkflowStatus as rs',
            'rsl.resultWorkflowStatusId',
            'rs.Id'
          )
          .where('rsl.id', result4.resultWorkflowStatusLogId)
          .first('externalId')
        assert.equal(result4Status.externalId, 'Deliverable')

        const [result4Category1, result4Category2] = await knex(
          'ResultCategory as rt'
        )
          .whereIn('id', [result4.resultCategory1, result4.resultCategory2])
          .select('externalId')
        assert.equal(result4Category1.externalId, 'Detected')
        assert.equal(result4Category2.externalId, 'NotDetected')
      }))

    it('should merge results with same id', () =>
      runTest(async knex => {
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
            assay: { id: 'DaktariHivVl' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        resultIds.push(await getLastResultId(knex, deviceId))

        let result1 = await knex('Result as r')
          .where({ id: resultIds[0] })
          .first()
        assert.equal(result1.externalId, resultExternalIds[0])
        assert.deepEqual(JSON.parse(result1.resultData), { a: 'b' })
        assert.isNotOk(result1.errorCode)
        assert.equal(initialCount + 1, await countResults())

        await server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            id: resultExternalIds[0],
            startedOn: now,
            data: { a: 'b', c: 'd' },
            assay: { id: 'DaktariHivVl' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        let lastResultId = await getLastResultId(knex, deviceId)
        assert.equal(lastResultId, resultIds[0])

        result1 = await knex('Result as r')
          .where({ id: resultIds[0] })
          .first()
        assert.equal(result1.externalId, resultExternalIds[0])
        assert.deepEqual(JSON.parse(result1.resultData), { a: 'b', c: 'd' })
        assert.isNotOk(result1.errorCode)
        assert.equal(initialCount + 1, await countResults())

        await server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            id: resultExternalIds[1],
            startedOn: now,
            data: { a: 'b' },
            assay: { id: 'DaktariHivVl' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        lastResultId = await getLastResultId(knex, deviceId)
        assert.notEqual(lastResultId, resultIds[0])
        resultIds.push(lastResultId)

        let result2 = await knex('Result as r')
          .where({ id: resultIds[1] })
          .first()
        assert.equal(result2.externalId, resultExternalIds[1])
        assert.equal(initialCount + 2, await countResults())

        const result1SampleSite = await knex('Site as s')
          .where({ id: result1.siteId })
          .first()

        const result2SampleSite = await knex('Site as s')
          .where('partnerId', result1SampleSite.partnerId)
          .where('id', '<>', result1.siteId)
          .first()

        await server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            id: resultExternalIds[1],
            data: { a: 'b', c: 2, d: false, e: { f: 'g' } },
            type: { id: 'Study' },
            source: { id: 'EnteredByHand' },
            workflow: { status: { id: 'Acknowledged' } },
            category: [{ id: 'Detected' }, { id: 'Indeterminate' }],
            assay: {
              id: 'DaktariHivVl',
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
            endedOn: '2013-12-01T01:30',
            consumable: {
              serial: '132-44-222',
              expirationDate: '2014-03-01',
              lot: '331-1',
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
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        lastResultId = await getLastResultId(knex, deviceId)
        assert.equal(lastResultId, resultIds[1])

        result2 = await knex('Result as r')
          .where({ id: resultIds[1] })
          .first()
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
        assert.deepEqual(result2.endedOn, new Date('2013-12-01T01:30'))
        assert.equal(result2.consumableSerial, '132-44-222')
        assert.deepEqual(
          result2.consumableExpirationDate,
          new Date('2014-03-01')
        )
        assert.equal(result2.consumableLot, '331-1')
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
        assert.equal(
          result2.notes,
          'My Awesome notes about this Awesome result!'
        )
        assert.equal(result2.errorCode, '123')
        assert.equal(result2.errorNotes, 'Oh NOZE!')

        const result2Type = await knex('ResultType as rt')
          .where({ id: result2.resultTypeId })
          .first('externalId')
        assert.equal(result2Type.externalId, 'Study')

        const result2Source = await knex('ResultSource as rs')
          .where({ id: result2.resultSourceId })
          .first('externalId')
        assert.equal(result2Source.externalId, 'EnteredByHand')

        const result2Status = await knex('ResultWorkflowLog as rsl')
          .innerJoin(
            'ResultWorkflowStatus as rs',
            'rsl.resultWorkflowStatusId',
            'rs.Id'
          )
          .where('rsl.id', result2.resultWorkflowStatusLogId)
          .first('externalId')
        assert.equal(result2Status.externalId, 'Acknowledged')

        const result2Assay = await knex('Assay as assay')
          .where({ id: result2.assayId })
          .first('externalId', 'name')
        assert.equal(result2Assay.externalId, 'DaktariHivVl')
        assert.equal(result2Assay.name, 'Daktari HIV-VL')

        const result2Sample = await knex('Sample as s')
          .where({ id: result2.sampleId })
          .first()

        assert.notEqual(result2.siteId, result2Sample.originSiteId)
        assert.equal(result2SampleSite.id, result2Sample.originSiteId)
        assert.equal(result2Sample.externalId, `Sample${now}`)

        const [result2Category1, result2Category2] = await knex(
          'ResultCategory as rt'
        )
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

        const [{ count: initialLogLength }] = await knex('DeviceLog').count(
          'id as count'
        )

        await server
          .get(devicePath)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body.result, 'undefined')
            assert.property(res.body, 'checkpoint')
          })

        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({ checkpoint: 'ck000' })

        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            checkpoint: 'ck123',
            configuration: { data: { a: 'b' } },
            operation: { data: { a: 'c' } },
            result: {
              startedOn: now,
              data: { a: 'd' },
              assay: { id: 'DaktariHivVl' },
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        resultIds.push(await getLastResultId(knex, deviceId))
        opIds.push(await getLastDeviceOperationId(knex, deviceId))

        const [{ count: logLength2 }] = await knex('DeviceLog').count(
          'id as count'
        )
        assert.equal(logLength2, initialLogLength + 2)

        const deviceLogResult2 = await knex('Result')
          .where({ id: resultIds[resultIds.length - 1] })
          .first()
        const deviceLogConfig2 = await getDeviceConfigurationData(
          knex,
          deviceId
        )
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

        await setResultAsDeliverableAndApprove(context, _.last(resultIds))

        await server
          .get(devicePath)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.equal(res.body.checkpoint, 'ck123')
            assert.typeOf(res.body.result, 'Object')
          })

        await server
          .get(`${devicePath}?checkpoint=ck000`)
          .set('Authorization', deviceAuth)
          .then(res => {
            // does not include result uploaded with previous checkpoint
            assert.equal(res.status, 200)
            assert.equal(res.body.checkpoint, 'ck000')
            assert.typeOf(res.body.result, 'undefined')
          })

        await server
          .get(`${devicePath}?checkpoint=ck123`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.equal(res.body.checkpoint, 'ck123')
            assert.typeOf(res.body.result, 'Object')

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.deepEqual(lastResult.data, { a: 'd' })
          })

        await server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            checkpoint: 'ck234',
            configuration: { data: { a: 'c' } },
            operation: { data: { a: 'd' } },
            result: {
              startedOn: now,
              data: { a: 'd' },
              assay: { id: 'DaktariHivVl' },
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        resultIds.push(await getLastResultId(knex, deviceId))
        opIds.push(await getLastDeviceOperationId(knex, deviceId))

        const [{ count: logLength3 }] = await knex('DeviceLog').count(
          'id as count'
        )

        assert.equal(logLength3, initialLogLength + 4) // previous + 1 result

        const deviceLogConfig3 = await getDeviceConfigurationData(
          knex,
          deviceId
        )
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

        await setResultAsDeliverableAndApprove(context, _.last(resultIds))

        await server
          .get(devicePath)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body.result, 'Object')
            assert.equal(res.body.checkpoint, 'ck234')
          })

        await server
          .get(`${devicePath}?checkpoint=ck234`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body.result, 'Object')
            assert.equal(res.body.checkpoint, 'ck234')
          })

        await server
          .get(`${devicePath}?checkpoint=ck123`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body.result, 'Object')
            assert.equal(res.body.checkpoint, 'ck123')
          })

        await server
          .get(`${devicePath}?checkpoint=ck000`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body.result, 'undefined')
            assert.equal(res.body.checkpoint, 'ck000')
          })
      }))

    describe('inventory management', () => {
      async function getInventoryItemsAtSite(knex, siteId) {
        return _.map(
          await knex('InventoryItem')
            .where({ siteId })
            .select(
              'id',
              'consumableId',
              'lotNumber',
              'expiresOn',
              'quantityOnHand'
            )
            .orderBy('id'),
          inventoryItem =>
            _.assign({}, inventoryItem, {
              expiresOn: parseDateOrDefault(inventoryItem.expiresOn),
            })
        )
      }

      it('should deduct inventory levels from the site', () =>
        runTest(async knex => {
          const { deviceId, deviceAuth, now } = context
          const results = [
            {
              assayExternalId: 'DaktariHivVl',
              cartridgeName: 'Daktari HIV-VL Cartridge',
              deviceId,
            },
          ]

          await Promise.all(
            _.map(results, async resultDetails => {
              const { siteId } = await knex('Device')
                .where({ id: resultDetails.deviceId })
                .first('siteId')
              const cartridgeId = (await knex('Consumable')
                .where({ name: resultDetails.cartridgeName })
                .first('id')).id

              const inventoryItemsBefore = await getInventoryItemsAtSite(
                knex,
                siteId
              )
              const firstCartridgeConsumable = _.find(
                inventoryItemsBefore,
                item =>
                  item.consumableId === cartridgeId && item.expiresOn != null
              )
              if (firstCartridgeConsumable) {
                const assayConsumables = await knex('ConsumableAssay as ca')
                  .join('Assay as a', 'ca.assayId', 'a.id')
                  .where('a.externalId', resultDetails.assayExternalId)
                  .select('ca.consumableId', 'ca.assayId', 'ca.quantity')

                await server
                  .post(devicePostResultPath)
                  .set('Authorization', deviceAuth)
                  .send({
                    startedOn: now,
                    data: { a: 'b' },
                    assay: { id: resultDetails.assayExternalId },
                    consumable: {
                      lot: firstCartridgeConsumable.lotNumber,
                      expirationDate: firstCartridgeConsumable.expiresOn.toJSON(),
                    },
                  })
                  .then(res => {
                    assert.equal(res.status, 200)
                  })

                const inventoryItemsAfter = await getInventoryItemsAtSite(
                  knex,
                  siteId
                )

                assayConsumables.forEach(assayConsumable => {
                  const inventoryItemBefore = _.find(inventoryItemsBefore, {
                    consumableId: assayConsumable.consumableId,
                  })
                  const inventoryItemAfter = _.find(inventoryItemsAfter, {
                    consumableId: assayConsumable.consumableId,
                  })

                  if (inventoryItemBefore) {
                    assert.equal(
                      inventoryItemAfter.quantityOnHand,
                      _.max([
                        0,
                        inventoryItemBefore.quantityOnHand -
                          assayConsumable.quantity,
                      ])
                    )
                  }
                })
              }
            })
          )
        }))

      it('should try to deduct the correct inventory item based on expiration date and lot number', () =>
        runTest(async knex => {
          const { deviceId, deviceAuth, now, user } = context
          const past = new Date(+now - 36000)
          const { siteId } = await knex('Device')
            .where({ id: deviceId })
            .first('siteId')
          const { id: adminId } = await knex('User')
            .where({ name: user })
            .first('id')
          const assayExternalId = 'DaktariHivVl'
          const daktariHivVlCartridgeId = (await knex('Consumable as c')
            .where('c.name', 'Daktari HIV-VL Cartridge')
            .first('c.id')).id

          let resultDetails = {
            lotNumber: 'ABC123',
            expirationDate: '2045-01-30 00:00:00',
          }

          const [lotNumberAndExpirationDateMatch] = await knex(
            'InventoryItem'
          ).insert({
            consumableId: daktariHivVlCartridgeId,
            siteId,
            lotNumber: resultDetails.lotNumber,
            expiresOn: new Date(resultDetails.expirationDate),
            quantityOnHand: 20,
            createdBy: adminId,
            createdOn: past,
            updatedBy: adminId,
            updatedOn: past,
          })

          const inventoryConsumedByTest = (await knex('ConsumableAssay as ca')
            .join('Assay as a', 'ca.assayId', 'a.id')
            .where('a.externalId', assayExternalId)
            .andWhere('ca.consumableId', daktariHivVlCartridgeId)
            .first('ca.quantity')).quantity

          let cartridgeAtSiteBefore = _.find(
            await getInventoryItemsAtSite(knex, siteId),
            inventoryItem =>
              inventoryItem.lotNumber === resultDetails.lotNumber &&
              inventoryItem.expiresOn.toISOString() ===
                new Date(resultDetails.expirationDate).toISOString()
          )

          await server
            .post(devicePostResultPath)
            .set('Authorization', deviceAuth)
            .send({
              startedOn: now,
              data: { a: 'b' },
              assay: { id: assayExternalId },
              sample: {
                id: Math.random()
                  .toString(36)
                  .slice(2),
              },
              instrument: { serial: '02384702' },
              consumable: {
                lot: resultDetails.lotNumber,
                expirationDate: resultDetails.expirationDate,
              },
            })
            .then(res => {
              assert.equal(res.status, 200)
            })

          let cartridgeAtSiteAfter = _.find(
            await getInventoryItemsAtSite(knex, siteId),
            inventoryItem =>
              inventoryItem.lotNumber === resultDetails.lotNumber &&
              inventoryItem.expiresOn.toISOString() ===
                new Date(resultDetails.expirationDate).toISOString()
          )

          assert.equal(
            cartridgeAtSiteAfter.quantityOnHand,
            _.max([
              0,
              cartridgeAtSiteBefore.quantityOnHand - inventoryConsumedByTest,
            ])
          )

          resultDetails = {
            lotNumber: 'XYZ321',
            expirationDate: '2035-01-30 00:00:00',
          }
          const randomExpiryDate = new Date('2017-03-05 00:00:00')
          const [onlyLotNumberMatches] = await knex('InventoryItem').insert({
            consumableId: daktariHivVlCartridgeId,
            siteId,
            lotNumber: resultDetails.lotNumber,
            expiresOn: randomExpiryDate,
            quantityOnHand: 30,
            createdBy: adminId,
            createdOn: past,
            updatedBy: adminId,
            updatedOn: past,
          })
          cartridgeAtSiteBefore = _.find(
            await getInventoryItemsAtSite(knex, siteId),
            inventoryItem =>
              inventoryItem.lotNumber === resultDetails.lotNumber &&
              inventoryItem.expiresOn.toISOString() ===
                new Date(randomExpiryDate).toISOString()
          )

          await server
            .post(devicePostResultPath)
            .set('Authorization', deviceAuth)
            .send({
              startedOn: now,
              data: { a: 'b' },
              assay: { id: assayExternalId },
              sample: {
                id: Math.random()
                  .toString(36)
                  .slice(2),
              },
              instrument: { serial: '02384702' },
              consumable: {
                lot: resultDetails.lotNumber,
                expirationDate: resultDetails.expirationDate,
              },
            })
            .then(res => {
              assert.equal(res.status, 200)
            })

          cartridgeAtSiteAfter = _.find(
            await getInventoryItemsAtSite(knex, siteId),
            inventoryItem =>
              inventoryItem.lotNumber === resultDetails.lotNumber &&
              inventoryItem.expiresOn.toISOString() ===
                new Date(randomExpiryDate).toISOString()
          )

          assert.equal(
            cartridgeAtSiteAfter.quantityOnHand,
            _.max([
              0,
              cartridgeAtSiteBefore.quantityOnHand - inventoryConsumedByTest,
            ])
          )

          resultDetails = {
            lotNumber: 'ABC123',
            expirationDate: '2019-11-16 00:00:00',
          }
          const randomLotNumber = 'RANDOM-LOT'
          const [onlyExpirationDateMatches] = await knex(
            'InventoryItem'
          ).insert({
            consumableId: daktariHivVlCartridgeId,
            siteId,
            lotNumber: randomLotNumber,
            expiresOn: new Date(resultDetails.expirationDate),
            quantityOnHand: 45,
            createdBy: adminId,
            createdOn: past,
            updatedBy: adminId,
            updatedOn: past,
          })
          cartridgeAtSiteBefore = _.find(
            await getInventoryItemsAtSite(knex, siteId),
            inventoryItem =>
              inventoryItem.lotNumber === randomLotNumber &&
              inventoryItem.expiresOn.toISOString() ===
                new Date(resultDetails.expirationDate).toISOString()
          )

          await server
            .post(devicePostResultPath)
            .set('Authorization', deviceAuth)
            .send({
              startedOn: now,
              data: { a: 'b' },
              assay: { id: assayExternalId },
              sample: {
                id: Math.random()
                  .toString(36)
                  .slice(2),
              },
              instrument: { serial: '02384702' },
              consumable: {
                lot: randomLotNumber,
                expirationDate: resultDetails.expirationDate,
              },
            })
            .then(res => {
              assert.equal(res.status, 200)
            })

          const inventoryAfter = await getInventoryItemsAtSite(knex, siteId)
          cartridgeAtSiteAfter = _.find(
            inventoryAfter,
            inventoryItem =>
              inventoryItem.lotNumber === randomLotNumber &&
              inventoryItem.expiresOn.toISOString() ===
                new Date(resultDetails.expirationDate).toISOString()
          )

          await knex('InventoryLog')
            .whereIn('inventoryItemId', [
              lotNumberAndExpirationDateMatch,
              onlyLotNumberMatches,
              onlyExpirationDateMatches,
            ])
            .del()
          await knex('InventoryItem')
            .whereIn('id', [
              lotNumberAndExpirationDateMatch,
              onlyLotNumberMatches,
              onlyExpirationDateMatches,
            ])
            .del()

          assert.equal(
            cartridgeAtSiteAfter.quantityOnHand,
            _.max([
              0,
              cartridgeAtSiteBefore.quantityOnHand - inventoryConsumedByTest,
            ])
          )
        }))

      it('should try to deduct the correct inventory item based on expiration date over lot number', () =>
        runTest(async knex => {
          const { deviceId, deviceAuth, now, user } = context
          const past = new Date(+now - 36000)
          const { siteId } = await knex('Device')
            .where({ id: deviceId })
            .first('siteId')
          const { id: adminId } = await knex('User')
            .where({ name: user })
            .first('id')
          const assayExternalId = 'DaktariHivVl'
          const daktariHivVlCartridgeId = (await knex('Consumable as c')
            .where('c.name', 'Daktari HIV-VL Cartridge')
            .first('c.id')).id
          const inventoryConsumedByTest = (await knex('ConsumableAssay as ca')
            .join('Assay as a', 'ca.assayId', 'a.id')
            .where('a.externalId', assayExternalId)
            .andWhere('ca.consumableId', daktariHivVlCartridgeId)
            .first('ca.quantity')).quantity

          const resultDetails = {
            lotNumber: 'QWE987',
            expirationDate: '2017-12-16 00:00:00',
          }
          const randomExpiryDate = new Date('2017-03-05 00:00:00')
          const [onlyLotNumberMatches] = await knex('InventoryItem').insert({
            consumableId: daktariHivVlCartridgeId,
            siteId,
            lotNumber: resultDetails.lotNumber,
            expiresOn: randomExpiryDate,
            quantityOnHand: 30,
            createdBy: adminId,
            createdOn: past,
            updatedBy: adminId,
            updatedOn: past,
          })
          const randomLotNumber = 'SOME-LOT-NUMBER'
          const [onlyExpirationDateMatches] = await knex(
            'InventoryItem'
          ).insert({
            consumableId: daktariHivVlCartridgeId,
            siteId,
            lotNumber: randomLotNumber,
            expiresOn: new Date(resultDetails.expirationDate),
            quantityOnHand: 45,
            createdBy: adminId,
            createdOn: past,
            updatedBy: adminId,
            updatedOn: past,
          })
          const inventoryItemsBefore = await getInventoryItemsAtSite(
            knex,
            siteId
          )
          const matchingLotNumberCartridgeAtSiteBefore = _.find(
            inventoryItemsBefore,
            inventoryItem =>
              inventoryItem.lotNumber === resultDetails.lotNumber &&
              inventoryItem.expiresOn.toISOString() ===
                new Date(randomExpiryDate).toISOString()
          )
          const matchingExpirationDateCartridgeAtSiteBefore = _.find(
            inventoryItemsBefore,
            inventoryItem =>
              inventoryItem.lotNumber === randomLotNumber &&
              inventoryItem.expiresOn.toISOString() ===
                new Date(resultDetails.expirationDate).toISOString()
          )

          await server
            .post(devicePostResultPath)
            .set('Authorization', deviceAuth)
            .send({
              startedOn: now,
              data: { a: 'b' },
              assay: { id: assayExternalId },
              consumable: {
                lot: resultDetails.lotNumber,
                expirationDate: resultDetails.expirationDate,
              },
            })
            .then(res => {
              assert.equal(res.status, 200)
            })

          const inventoryItemsAfter = await getInventoryItemsAtSite(
            knex,
            siteId
          )

          await knex('InventoryLog')
            .whereIn('inventoryItemId', [
              onlyLotNumberMatches,
              onlyExpirationDateMatches,
            ])
            .del()
          await knex('InventoryItem')
            .whereIn('id', [onlyLotNumberMatches, onlyExpirationDateMatches])
            .del()

          const matchingLotNumberCartridgeAtSiteAfter = _.find(
            inventoryItemsAfter,
            inventoryItem =>
              inventoryItem.lotNumber === resultDetails.lotNumber &&
              inventoryItem.expiresOn.toISOString() ===
                new Date(randomExpiryDate).toISOString()
          )
          const matchingExpirationDateCartridgeAtSiteAfter = _.find(
            inventoryItemsAfter,
            inventoryItem =>
              inventoryItem.lotNumber === randomLotNumber &&
              inventoryItem.expiresOn.toISOString() ===
                new Date(resultDetails.expirationDate).toISOString()
          )

          assert.equal(
            matchingLotNumberCartridgeAtSiteAfter.quantityOnHand,
            matchingLotNumberCartridgeAtSiteBefore.quantityOnHand
          )

          assert.equal(
            matchingExpirationDateCartridgeAtSiteAfter.quantityOnHand,
            _.max([
              0,
              matchingExpirationDateCartridgeAtSiteBefore.quantityOnHand -
                inventoryConsumedByTest,
            ])
          )
        }))

      it('should deduct inventory item with null lot number and expiresOn', () =>
        runTest(async knex => {
          const { deviceId, deviceAuth, now, user } = context
          const { siteId } = await knex('Device')
            .where({ id: deviceId })
            .first('siteId')
          const { id: adminId } = await knex('User')
            .where({ name: user })
            .first('id')

          const past = subDays(now, 1)
          const future = addDays(now, 7)

          const assayExternalId = 'DaktariHivVl'
          const { id: daktariHivVlCartridgeId } = await knex('Consumable as c')
            .where('c.name', 'Daktari HIV-VL Cartridge')
            .first('c.id')

          // Remove inventory item if it already exists
          await knex('InventoryItem')
            .where({ consumableId: daktariHivVlCartridgeId, siteId })
            .del()

          const [inventoryItemId] = await knex('InventoryItem').insert({
            consumableId: daktariHivVlCartridgeId,
            siteId,
            lotNumber: null,
            expiresOn: null,
            quantityOnHand: 50,
            createdBy: adminId,
            createdOn: past,
            updatedBy: adminId,
            updatedOn: past,
          })

          const { quantity: inventoryConsumedByTest } = await knex(
            'ConsumableAssay as ca'
          )
            .join('Assay as a', 'ca.assayId', 'a.id')
            .where('a.externalId', assayExternalId)
            .andWhere('ca.consumableId', daktariHivVlCartridgeId)
            .first('ca.quantity')

          const resultDetails = {
            lotNumber: 'HIV582',
            expirationDate: startOfDay(future).toISOString(),
          }

          const inventoryItemsBefore = await getInventoryItemsAtSite(
            knex,
            siteId
          )
          const inventoryItemBefore = _.find(inventoryItemsBefore, {
            id: inventoryItemId,
          })
          assert.isOk(inventoryItemBefore)
          assert.isNotOk(inventoryItemBefore.lotNumber)
          assert.isNotOk(inventoryItemBefore.expiresOn)
          assert.equal(inventoryItemBefore.quantityOnHand, 50)

          const inventoryLogsBefore = await knex('InventoryLog')
            .where({ inventoryItemId })
            .select('id')
          assert.equal(inventoryLogsBefore.length, 0)

          await server
            .post(devicePostResultPath)
            .set('Authorization', deviceAuth)
            .send({
              startedOn: now,
              data: { b: 'c' },
              assay: { id: assayExternalId },
              sample: { id: 'New Test Deduct From Null Item' },
              instrument: { serial: '123456789' },
              consumable: {
                lot: resultDetails.lotNumber,
                expirationDate: resultDetails.expirationDate,
              },
            })
            .then(res => {
              assert.equal(res.status, 200)
            })

          const inventoryItemsAfter = await getInventoryItemsAtSite(
            knex,
            siteId
          )
          assert.deepEqual(
            _.map(inventoryItemsBefore, 'id'),
            _.map(inventoryItemsAfter, 'id')
          )
          const inventoryItemAfter = _.find(inventoryItemsAfter, {
            id: inventoryItemId,
          })
          assert.isNotOk(inventoryItemAfter.lotNumber)
          assert.isNotOk(inventoryItemAfter.expiresOn)
          assert.equal(
            inventoryItemAfter.quantityOnHand,
            inventoryItemBefore.quantityOnHand - inventoryConsumedByTest
          )

          const inventoryLogsAfter = await knex('InventoryLog')
            .where({ inventoryItemId })
            .select()
          assert.equal(inventoryLogsAfter.length, 1)

          const inventoryLog = inventoryLogsAfter[0]
          assert.equal(inventoryLog.inventoryItemId, inventoryItemId)
          assert.isOk(inventoryLog.resultId)

          const result = await getResult(knex, inventoryLog.resultId)
          assert.equal(result.sample.id, 'New Test Deduct From Null Item')
          assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
          assert.equal(
            parseDateOrDefault(
              result.consumable[0].expirationDate
            ).toISOString(),
            parseDateOrDefault(resultDetails.expirationDate).toISOString()
          )
        }))

      it('should update lot number if null and exact match of expiresOn', () =>
        runTest(async knex => {
          const { deviceId, deviceAuth, now, user } = context
          const { siteId } = await knex('Device')
            .where({ id: deviceId })
            .first('siteId')
          const { id: adminId } = await knex('User')
            .where({ name: user })
            .first('id')

          const past = subDays(now, 1)
          const future = addDays(now, 7)
          const futureExpiresOn = startOfDay(future)

          const assayExternalId = 'DaktariHivVl'
          const { id: daktariHivVlCartridgeId } = await knex('Consumable as c')
            .where('c.name', 'Daktari HIV-VL Cartridge')
            .first('c.id')

          await knex('InventoryItem')
            .where({ consumableId: daktariHivVlCartridgeId, siteId })
            .del()

          const [inventoryItemId] = await knex('InventoryItem').insert({
            consumableId: daktariHivVlCartridgeId,
            siteId,
            lotNumber: null,
            expiresOn: futureExpiresOn,
            quantityOnHand: 50,
            createdBy: adminId,
            createdOn: past,
            updatedBy: adminId,
            updatedOn: past,
          })

          const { quantity: inventoryConsumedByTest } = await knex(
            'ConsumableAssay as ca'
          )
            .join('Assay as a', 'ca.assayId', 'a.id')
            .where('a.externalId', assayExternalId)
            .andWhere('ca.consumableId', daktariHivVlCartridgeId)
            .first('ca.quantity')

          const resultDetails = {
            lotNumber: 'HIV58119',
            expirationDate: futureExpiresOn.toISOString(),
          }

          const inventoryItemsBefore = await getInventoryItemsAtSite(
            knex,
            siteId
          )
          const inventoryItemBefore = _.find(inventoryItemsBefore, {
            id: inventoryItemId,
          })
          assert.isOk(inventoryItemBefore)
          assert.isNotOk(inventoryItemBefore.lotNumber)
          assert.equal(
            inventoryItemBefore.expiresOn.toISOString(),
            futureExpiresOn.toISOString()
          )
          assert.equal(inventoryItemBefore.quantityOnHand, 50)

          const inventoryLogsBefore = await knex('InventoryLog')
            .where({ inventoryItemId })
            .select('id')
          assert.equal(inventoryLogsBefore.length, 0)

          await server
            .post(devicePostResultPath)
            .set('Authorization', deviceAuth)
            .send({
              startedOn: now,
              data: { b: 'c' },
              assay: { id: assayExternalId },
              sample: { id: 'New Test Deduct Update Lot Number' },
              instrument: { serial: '1234567893' },
              consumable: {
                lot: resultDetails.lotNumber,
                expirationDate: resultDetails.expirationDate,
              },
            })
            .then(res => {
              assert.equal(res.status, 200)
            })

          let inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)
          assert.deepEqual(
            _.map(inventoryItemsBefore, 'id'),
            _.map(inventoryItemsAfter, 'id')
          )
          let inventoryItemAfter = _.find(inventoryItemsAfter, {
            id: inventoryItemId,
          })
          assert.equal(inventoryItemAfter.lotNumber, resultDetails.lotNumber)
          assert.equal(
            inventoryItemAfter.expiresOn.toISOString(),
            futureExpiresOn.toISOString()
          )
          assert.equal(
            inventoryItemAfter.quantityOnHand,
            inventoryItemBefore.quantityOnHand - inventoryConsumedByTest
          )

          let inventoryLogsAfter = await knex('InventoryLog')
            .where({ inventoryItemId })
            .select()
          assert.equal(inventoryLogsAfter.length, 1)

          let [inventoryLog] = inventoryLogsAfter
          assert.equal(inventoryLog.inventoryItemId, inventoryItemId)
          assert.isOk(inventoryLog.resultId)

          let result = await getResult(knex, inventoryLog.resultId)
          assert.equal(result.sample.id, 'New Test Deduct Update Lot Number')
          assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
          assert.equal(
            parseDateOrDefault(
              result.consumable[0].expirationDate
            ).toISOString(),
            parseDateOrDefault(resultDetails.expirationDate).toISOString()
          )

          await server
            .post(devicePostResultPath)
            .set('Authorization', deviceAuth)
            .send({
              startedOn: now,
              data: { b: 'd' },
              assay: { id: assayExternalId },
              sample: { id: 'New Test Deduct Update Lot Number 2' },
              instrument: { serial: '1234567893' },
              consumable: {
                lot: resultDetails.lotNumber,
                expirationDate: resultDetails.expirationDate,
              },
            })
            .then(res => {
              assert.equal(res.status, 200)
            })

          inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)
          assert.deepEqual(
            _.map(inventoryItemsBefore, 'id'),
            _.map(inventoryItemsAfter, 'id')
          )
          inventoryItemAfter = _.find(inventoryItemsAfter, {
            id: inventoryItemId,
          })
          assert.equal(inventoryItemAfter.lotNumber, resultDetails.lotNumber)
          assert.equal(
            inventoryItemAfter.expiresOn.toISOString(),
            futureExpiresOn.toISOString()
          )
          assert.equal(
            inventoryItemAfter.quantityOnHand,
            inventoryItemBefore.quantityOnHand - inventoryConsumedByTest * 2
          )

          inventoryLogsAfter = await knex('InventoryLog')
            .where({ inventoryItemId })
            .orderBy('id', 'desc')
            .select()
          assert.equal(inventoryLogsAfter.length, 2)
          ;[inventoryLog] = inventoryLogsAfter
          assert.equal(inventoryLog.inventoryItemId, inventoryItemId)
          assert.isOk(inventoryLog.resultId)

          result = await getResult(knex, inventoryLog.resultId)
          assert.equal(result.sample.id, 'New Test Deduct Update Lot Number 2')
          assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
          assert.equal(
            parseDateOrDefault(
              result.consumable[0].expirationDate
            ).toISOString(),
            parseDateOrDefault(resultDetails.expirationDate).toISOString()
          )
        }))

      it('should update quantityOnHand only if tested on before item updatedOn', () =>
        runTest(async knex => {
          const { deviceId, deviceAuth, now, user } = context
          const { siteId } = await knex('Device')
            .where({ id: deviceId })
            .first('siteId')
          const { id: adminId } = await knex('User')
            .where({ name: user })
            .first('id')

          const past = subDays(now, 1)
          const future = addDays(now, 7)
          const futureExpiresOn = startOfDay(future)

          const assayExternalId = 'DaktariHivVl'
          const { id: daktariHivVlCartridgeId } = await knex('Consumable as c')
            .where('c.name', 'Daktari HIV-VL Cartridge')
            .first('c.id')

          await knex('InventoryItem')
            .where({ consumableId: daktariHivVlCartridgeId, siteId })
            .del()

          const [inventoryItemId] = await knex('InventoryItem').insert({
            consumableId: daktariHivVlCartridgeId,
            siteId,
            lotNumber: 'HIV58210',
            expiresOn: null,
            quantityOnHand: 50,
            createdBy: adminId,
            createdOn: past,
            updatedBy: adminId,
            updatedOn: past,
          })

          const { quantity: inventoryConsumedByTest } = await knex(
            'ConsumableAssay as ca'
          )
            .join('Assay as a', 'ca.assayId', 'a.id')
            .where('a.externalId', assayExternalId)
            .andWhere('ca.consumableId', daktariHivVlCartridgeId)
            .first('ca.quantity')

          const resultDetails = {
            lotNumber: 'HIV58210',
            expirationDate: futureExpiresOn.toISOString(),
          }

          const inventoryItemsBefore = await getInventoryItemsAtSite(
            knex,
            siteId
          )
          const inventoryItemBefore = _.find(inventoryItemsBefore, {
            id: inventoryItemId,
          })
          assert.isOk(inventoryItemBefore)
          assert.equal(inventoryItemBefore.lotNumber, resultDetails.lotNumber)
          assert.isNotOk(inventoryItemBefore.expiresOn)
          assert.equal(inventoryItemBefore.quantityOnHand, 50)

          const inventoryLogsBefore = await knex('InventoryLog')
            .where({ inventoryItemId })
            .select('id')
          assert.equal(inventoryLogsBefore.length, 0)

          await server
            .post(devicePostResultPath)
            .set('Authorization', deviceAuth)
            .send({
              startedOn: now,
              data: { b: 'c' },
              assay: { id: assayExternalId },
              sample: { id: 'New Test Deduct Update Lot Number' },
              instrument: { serial: '1234567893' },
              consumable: {
                lot: resultDetails.lotNumber,
                expirationDate: resultDetails.expirationDate,
              },
            })
            .then(res => {
              assert.equal(res.status, 200)
            })

          let inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)
          assert.deepEqual(
            _.map(inventoryItemsBefore, 'id'),
            _.map(inventoryItemsAfter, 'id')
          )
          let inventoryItemAfter = _.find(inventoryItemsAfter, {
            id: inventoryItemId,
          })
          assert.equal(inventoryItemAfter.lotNumber, resultDetails.lotNumber)
          assert.isNotOk(inventoryItemAfter.expiresOn)
          assert.equal(
            inventoryItemAfter.quantityOnHand,
            inventoryItemBefore.quantityOnHand - inventoryConsumedByTest
          )

          let inventoryLogsAfter = await knex('InventoryLog')
            .where({ inventoryItemId })
            .select()
          assert.equal(inventoryLogsAfter.length, 1)

          let [inventoryLog] = inventoryLogsAfter
          assert.equal(inventoryLog.inventoryItemId, inventoryItemId)
          assert.isOk(inventoryLog.resultId)

          let result = await getResult(knex, inventoryLog.resultId)
          assert.equal(result.sample.id, 'New Test Deduct Update Lot Number')
          assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
          assert.equal(
            parseDateOrDefault(
              result.consumable[0].expirationDate
            ).toISOString(),
            parseDateOrDefault(resultDetails.expirationDate).toISOString()
          )

          const newQuantityOnHand = 30
          await knex('InventoryItem')
            .where({ id: inventoryItemId })
            .update({ updatedOn: now, quantityOnHand: newQuantityOnHand })

          await server
            .post(devicePostResultPath)
            .set('Authorization', deviceAuth)
            .send({
              startedOn: past,
              data: { b: 'd' },
              assay: { id: assayExternalId },
              sample: { id: 'New Test Deduct Update Lot Number 2' },
              instrument: { serial: '1234567893' },
              consumable: {
                lot: resultDetails.lotNumber,
                expirationDate: resultDetails.expirationDate,
              },
            })
            .then(res => {
              assert.equal(res.status, 200)
            })

          inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)
          assert.deepEqual(
            _.map(inventoryItemsBefore, 'id'),
            _.map(inventoryItemsAfter, 'id')
          )
          inventoryItemAfter = _.find(inventoryItemsAfter, {
            id: inventoryItemId,
          })
          assert.equal(inventoryItemAfter.lotNumber, resultDetails.lotNumber)
          assert.isNotOk(inventoryItemAfter.expiresOn)
          assert.equal(inventoryItemAfter.quantityOnHand, newQuantityOnHand)

          inventoryLogsAfter = await knex('InventoryLog')
            .where({ inventoryItemId })
            .orderBy('id', 'desc')
            .select()
          assert.equal(inventoryLogsAfter.length, 2)
          ;[inventoryLog] = inventoryLogsAfter
          assert.equal(inventoryLog.inventoryItemId, inventoryItemId)
          assert.isOk(inventoryLog.resultId)

          result = await getResult(knex, inventoryLog.resultId)
          assert.equal(result.sample.id, 'New Test Deduct Update Lot Number 2')
          assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
          assert.equal(
            parseDateOrDefault(
              result.consumable[0].expirationDate
            ).toISOString(),
            parseDateOrDefault(resultDetails.expirationDate).toISOString()
          )

          await server
            .post(devicePostResultPath)
            .set('Authorization', deviceAuth)
            .send({
              startedOn: future,
              data: { b: 'e' },
              assay: { id: assayExternalId },
              sample: { id: 'New Test Deduct Update Lot Number 3' },
              instrument: { serial: '1234567893' },
              consumable: {
                lot: resultDetails.lotNumber,
                expirationDate: resultDetails.expirationDate,
              },
            })
            .then(res => {
              assert.equal(res.status, 200)
            })

          inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)
          assert.deepEqual(
            _.map(inventoryItemsBefore, 'id'),
            _.map(inventoryItemsAfter, 'id')
          )
          inventoryItemAfter = _.find(inventoryItemsAfter, {
            id: inventoryItemId,
          })
          assert.equal(inventoryItemAfter.lotNumber, resultDetails.lotNumber)
          assert.isNotOk(inventoryItemAfter.expiresOn)
          assert.equal(
            inventoryItemAfter.quantityOnHand,
            newQuantityOnHand - inventoryConsumedByTest
          )

          inventoryLogsAfter = await knex('InventoryLog')
            .where({ inventoryItemId })
            .orderBy('id', 'desc')
            .select()
          assert.equal(inventoryLogsAfter.length, 3)
          ;[inventoryLog] = inventoryLogsAfter
          assert.equal(inventoryLog.inventoryItemId, inventoryItemId)
          assert.isOk(inventoryLog.resultId)

          result = await getResult(knex, inventoryLog.resultId)
          assert.equal(result.sample.id, 'New Test Deduct Update Lot Number 3')
          assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
          assert.equal(
            parseDateOrDefault(
              result.consumable[0].expirationDate
            ).toISOString(),
            parseDateOrDefault(resultDetails.expirationDate).toISOString()
          )
        }))

      it('should deduct inventory item with closest expiresOn', () =>
        runTest(async knex => {
          const { deviceId, deviceAuth, now, user } = context
          const { siteId } = await knex('Device')
            .where({ id: deviceId })
            .first('siteId')
          const { id: adminId } = await knex('User')
            .where({ name: user })
            .first('id')

          const past = subDays(now, 1)
          const future = addDays(now, 7)

          const assayExternalId = 'DaktariHivVl'
          const { id: daktariHivVlCartridgeId } = await knex('Consumable as c')
            .where('c.name', 'Daktari HIV-VL Cartridge')
            .first('c.id')

          // Remove inventory item if it already exists
          await knex('InventoryItem')
            .where({ consumableId: daktariHivVlCartridgeId, siteId })
            .del()

          const [inventoryItemNotAsCloseId] = await knex(
            'InventoryItem'
          ).insert({
            consumableId: daktariHivVlCartridgeId,
            siteId,
            lotNumber: 'not as close',
            expiresOn: addDays(future, 2),
            quantityOnHand: 40,
            createdBy: adminId,
            createdOn: subDays(past, 3),
            updatedBy: adminId,
            updatedOn: past,
          })

          const [inventoryItemClosestId] = await knex('InventoryItem').insert({
            consumableId: daktariHivVlCartridgeId,
            siteId,
            lotNumber: 'closest',
            expiresOn: addDays(future, 1),
            quantityOnHand: 30,
            createdBy: adminId,
            createdOn: subDays(past, 2),
            updatedBy: adminId,
            updatedOn: past,
          })

          const [inventoryItemStillNotAsCloseId] = await knex(
            'InventoryItem'
          ).insert({
            consumableId: daktariHivVlCartridgeId,
            siteId,
            lotNumber: 'still not as close',
            expiresOn: subDays(future, 2),
            quantityOnHand: 50,
            createdBy: adminId,
            createdOn: subDays(past, 4),
            updatedBy: adminId,
            updatedOn: past,
          })

          const { quantity: inventoryConsumedByTest } = await knex(
            'ConsumableAssay as ca'
          )
            .join('Assay as a', 'ca.assayId', 'a.id')
            .where('a.externalId', assayExternalId)
            .andWhere('ca.consumableId', daktariHivVlCartridgeId)
            .first('ca.quantity')

          const resultDetails = {
            lotNumber: null,
            expirationDate: startOfDay(future).toISOString(),
          }

          const inventoryItemsBefore = await getInventoryItemsAtSite(
            knex,
            siteId
          )
          const inventoryItemBefore = _.find(inventoryItemsBefore, {
            id: inventoryItemClosestId,
          })
          const inventoryLogsBefore = await knex('InventoryLog')
            .whereIn('inventoryItemId', [
              inventoryItemClosestId,
              inventoryItemNotAsCloseId,
              inventoryItemStillNotAsCloseId,
            ])
            .select('id')
          assert.equal(inventoryLogsBefore.length, 0)

          await server
            .post(devicePostResultPath)
            .set('Authorization', deviceAuth)
            .send({
              startedOn: now,
              data: { b: 'c' },
              assay: { id: assayExternalId },
              sample: { id: 'New Test Deduct From Closest Item' },
              instrument: { serial: '423456789' },
              consumable: {
                lot: resultDetails.lotNumber,
                expirationDate: resultDetails.expirationDate,
              },
            })
            .then(res => {
              assert.equal(res.status, 200)
            })

          const inventoryItemsAfter = await getInventoryItemsAtSite(
            knex,
            siteId
          )
          assert.deepEqual(
            _.map(inventoryItemsBefore, 'id'),
            _.map(inventoryItemsAfter, 'id')
          )
          const inventoryItemAfter = _.find(inventoryItemsAfter, {
            id: inventoryItemClosestId,
          })
          assert.equal(inventoryItemAfter.lotNumber, 'closest')
          assert.equal(
            parseDateOrDefault(inventoryItemBefore.expiresOn).toISOString(),
            parseDateOrDefault(inventoryItemAfter.expiresOn).toISOString()
          )
          assert.equal(
            inventoryItemAfter.quantityOnHand,
            inventoryItemBefore.quantityOnHand - inventoryConsumedByTest
          )

          const inventoryLogsAfter = await knex('InventoryLog')
            .whereIn('inventoryItemId', [
              inventoryItemClosestId,
              inventoryItemNotAsCloseId,
              inventoryItemStillNotAsCloseId,
            ])
            .select()
          assert.equal(inventoryLogsAfter.length, 1)

          const inventoryLog = inventoryLogsAfter[0]
          assert.equal(inventoryLog.inventoryItemId, inventoryItemClosestId)
          assert.isOk(inventoryLog.resultId)

          const result = await getResult(knex, inventoryLog.resultId)
          assert.equal(result.sample.id, 'New Test Deduct From Closest Item')
          assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
          assert.equal(
            parseDateOrDefault(
              result.consumable[0].expirationDate
            ).toISOString(),
            parseDateOrDefault(resultDetails.expirationDate).toISOString()
          )
        }))

      it('should log inventory consumption, even when no inventory item exists for site', () =>
        runTest(async knex => {
          const { deviceId, deviceAuth, now } = context
          const { siteId } = await knex('Device')
            .where({ id: deviceId })
            .first('siteId')
          const assayExternalId = 'DaktariHivVl'
          const daktariHivVlCartridgeId = (await knex('Consumable as c')
            .where('c.name', 'Daktari HIV-VL Cartridge')
            .first('c.id')).id
          // Remove inventory item if it already exists
          await knex('InventoryItem')
            .where({ consumableId: daktariHivVlCartridgeId, siteId })
            .del()
          const inventoryConsumedByTest = (await knex('ConsumableAssay as ca')
            .join('Assay as a', 'ca.assayId', 'a.id')
            .where('a.externalId', assayExternalId)
            .andWhere('ca.consumableId', daktariHivVlCartridgeId)
            .first('ca.quantity')).quantity

          const resultDetails = {
            lotNumber: 'HIV533',
            expirationDate: new Date(
              new Date(
                new Date().getTime() + _.random(0, 1000 * 60 * 60 * 24 * 365)
              ).setHours(0, 0, 0, 0)
            ).toJSON(),
          }
          const inventoryItemsBefore = await getInventoryItemsAtSite(
            knex,
            siteId
          )

          assert.isUndefined(
            _.find(inventoryItemsBefore, { lotNumber: resultDetails.lotNumber })
          )

          await server
            .post(devicePostResultPath)
            .set('Authorization', deviceAuth)
            .send({
              startedOn: now,
              data: { a: 'b' },
              assay: { id: assayExternalId },
              sample: { id: 'New Test Deduct Unknown Item' },
              instrument: { serial: '123456789' },
              consumable: {
                lot: resultDetails.lotNumber,
                expirationDate: resultDetails.expirationDate,
              },
            })
            .then(res => {
              assert.equal(res.status, 200)
            })

          const inventoryItemsAfter = await getInventoryItemsAtSite(
            knex,
            siteId
          )

          const inventoryConsumptionLog = await knex('InventoryLog as il')
            .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
            .where('il.consumableId', daktariHivVlCartridgeId)
            .andWhere('il.siteId', siteId)
            .andWhere('il.lotNumber', resultDetails.lotNumber)
            .andWhere('il.expiresOn', new Date(resultDetails.expirationDate))
            .first(
              'il.id',
              'il.inventoryItemId',
              'cr.name as consumableReasonName',
              'il.resultId',
              'il.lotNumber',
              'il.expiresOn',
              'il.quantity',
              'il.createdOn'
            )

          const {
            count: otherInventoryConsumptionLogsForThisTest,
          } = await knex('InventoryLog')
            .whereNot({ id: inventoryConsumptionLog.id })
            .andWhere({ siteId, createdOn: inventoryConsumptionLog.createdOn })
            .count('id as count')

          await knex('InventoryLog')
            .where({ resultId: inventoryConsumptionLog.resultId })
            .del()

          await knex('InventoryItem')
            .where({ id: inventoryConsumptionLog.inventoryItemId })
            .del()

          assert.isOk(
            _.find(inventoryItemsAfter, { lotNumber: resultDetails.lotNumber })
          )
          assert.isOk(inventoryConsumptionLog.inventoryItemId)

          assert.equal(
            inventoryConsumptionLog.consumableReasonName,
            'Test Conducted'
          )
          assert.isOk(inventoryConsumptionLog.resultId)
          assert.equal(
            inventoryConsumptionLog.lotNumber,
            resultDetails.lotNumber
          )
          assert.equal(
            inventoryConsumptionLog.expiresOn.toISOString(),
            new Date(resultDetails.expirationDate).toISOString()
          )
          assert.equal(
            inventoryConsumptionLog.quantity,
            Math.abs(inventoryConsumedByTest)
          )

          assert.isNotOk(otherInventoryConsumptionLogsForThisTest)
        }))
    })

    describe('fact tables', () => {
      function getFactResultsDevice(knex, deviceId) {
        return knex('FactResultsDevice')
          .where({ deviceId })
          .select('deviceId', 'days', 'resultCount', 'calculatedOn')
      }

      function getFactResultsDeviceByAssay(knex, deviceId, assayId) {
        return knex('FactResultsDeviceByAssay')
          .where({ deviceId })
          .andWhere({ assayId })
          .select('deviceId', 'assayId', 'days', 'resultCount', 'calculatedOn')
      }

      function getFactResultsDeviceByCategory1(
        knex,
        deviceId,
        assayId,
        resultCategory1
      ) {
        return knex('FactResultsDeviceByCategory1')
          .where({ deviceId })
          .andWhere({ assayId })
          .andWhere({ resultCategory1 })
          .select(
            'deviceId',
            'assayId',
            'resultCategory1',
            'days',
            'resultCount',
            'calculatedOn'
          )
      }

      function getFactResultsDeviceByCategory1And2(
        knex,
        deviceId,
        assayId,
        resultCategory1,
        resultCategory2
      ) {
        return knex('FactResultsDeviceByCategory1And2')
          .where({ deviceId })
          .andWhere({ assayId })
          .andWhere({ resultCategory1 })
          .andWhere({ resultCategory2 })
          .select(
            'deviceId',
            'assayId',
            'resultCategory1',
            'resultCategory2',
            'days',
            'resultCount',
            'calculatedOn'
          )
      }

      it('should update the result counts in the facts-tables when a new result is reported', () =>
        runTest(async knex => {
          const resultDetails = {
            assayExternalId: 'DaktariHivVl',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'MoreThan1000',
            deviceId: context.deviceId,
          }

          const { id: assayId } = await knex('Assay')
            .where('externalId', resultDetails.assayExternalId)
            .first('id')

          const { id: resultCategory1 } = await knex('ResultCategory')
            .where('externalId', resultDetails.resultCategory1ExternalId)
            .first('id')

          const { id: resultCategory2 } = await knex('ResultCategory')
            .where('externalId', resultDetails.resultCategory2ExternalId)
            .first('id')

          await server
            .post(devicePostResultPath)
            .set('Authorization', context.deviceAuth)
            .send({
              id: new Date().getTime().toString(),
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

          const factResultsDeviceBefore = await getFactResultsDevice(
            knex,
            context.deviceId
          )

          const factResultsDeviceByAssayBefore = await getFactResultsDeviceByAssay(
            knex,
            context.deviceId,
            assayId
          )

          const factResultsDeviceByCategory1Before = await getFactResultsDeviceByCategory1(
            knex,
            context.deviceId,
            assayId,
            resultCategory1
          )

          const factResultsDeviceByCategory1And2Before = await getFactResultsDeviceByCategory1And2(
            knex,
            context.deviceId,
            assayId,
            resultCategory1,
            resultCategory2
          )

          assert.equal(
            factResultsDeviceBefore.length,
            7,
            'There should be one entry per day in the device count table'
          )

          await server
            .post(devicePostResultPath)
            .set('Authorization', context.deviceAuth)
            .send({
              id: new Date().getTime().toString(),
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

          const factResultsDeviceAfter = await getFactResultsDevice(
            knex,
            context.deviceId
          )

          const factResultsDeviceByAssayAfter = await getFactResultsDeviceByAssay(
            knex,
            context.deviceId,
            assayId
          )

          const factResultsDeviceByCategory1After = await getFactResultsDeviceByCategory1(
            knex,
            context.deviceId,
            assayId,
            resultCategory1
          )

          const factResultsDeviceByCategory1And2After = await getFactResultsDeviceByCategory1And2(
            knex,
            context.deviceId,
            assayId,
            resultCategory1,
            resultCategory2
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

          factResultsDeviceByCategory1And2Before.forEach(countBefore => {
            const countAfter = _.find(factResultsDeviceByCategory1And2After, {
              days: countBefore.days,
              resultCategory1: countBefore.resultCategory1,
              resultCategory2: countBefore.resultCategory2,
            })

            // compare before and after counts
            if (countAfter) {
              assert.equal(
                countAfter.resultCount,
                countBefore.resultCount + 1,
                'Count in device category 1 and 2 fact-table should have increased by one after posting a result'
              )
            }
          })
        }))
    })
  })
})
