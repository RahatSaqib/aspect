const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const { format, subDays, subMinutes } = require('date-fns')
const {
  createTestContext,
  getDeviceConfigurationData,
  getDeviceFromApiKey,
  getLastDeviceOperationId,
  getLastDeviceOperationData,
  getLastResultId,
} = require('./utils')

// This agent refers to PORT where program is running.
const server = supertest.agent('http://localhost:8080')
const { assert } = chai

const devicePath = '/device'
const devicePostResultPath = '/device/result'

const baseConfig = {
  requirePrinter: 'no',
  adminPassword: 'pwd123',
  firmwareUpdateRequired: 'yes',
  modules: {
    module1: '18889030',
    module2: '51395910',
    module3: '33550994',
    module4: '73235848',
  },
}

const now = new Date()

// Number of milliseconds to wait for completion of
// asynchronous updates as acceptance criteria
const ASYNC_TEST_ACCEPTANCE_TIME = 250

// Waits acceptance time and resolves promise with optional result
function waitAsyncComplete(result) {
  return new Promise(resolve =>
    setTimeout(() => resolve(result), ASYNC_TEST_ACCEPTANCE_TIME)
  )
}

describe('Device Result API routes', () => {
  const clientBasePath = '/api/result'

  function setResultAsDeliverable(context, resultId) {
    const { clientAuth } = context
    const clientSingleResultPath = `${clientBasePath}/`
    return server
      .put(`${clientSingleResultPath}workflow-status/${resultId}`)
      .send({ externalId: 'Deliverable' })
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
      type: 'GeneXpert',
    })

    const { runTest } = context

    beforeEach(context.beforeEach)
    afterEach(context.afterEach)

    it('should add and return device results', () =>
      runTest(function*(knex) {
        const resultIds = []
        const { deviceId, clientAuth, deviceAuth } = context
        const clientSingleResultPath = `${clientBasePath}/`
        const clientPath = `${clientBasePath}?deviceId=${deviceId}&size=1000`

        let initialDataLength = 0
        const [{ count: initialLogLength }] = yield knex('DeviceLog').count(
          'id as count'
        )

        yield server
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

        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({ checkpoint: 'ck0' })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        let deviceFirstName
        const deviceChangedName = `Device Changed Name ${now}`
        yield server
          .get(`${devicePath}?checkpoint=ck0`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.typeOf(res.body.name, 'string')
            assert.equal(res.body.checkpoint, 'ck0')
            deviceFirstName = res.body.name
          })

        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            name: deviceChangedName,
            checkpoint: 'ck1',
            result: {
              data: { a: 'b' },
              assay: { id: 'HivVl' },
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        resultIds.push(yield* getLastResultId(knex, deviceId))

        const [{ count: logLength1 }] = yield knex('DeviceLog').count(
          'id as count'
        )

        assert.equal(logLength1, initialLogLength + 2) // checkpoint + post

        yield server
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

        const result1 = yield knex('Result as r')
          .where({ id: resultIds[0] })
          .first()

        assert.deepEqual(JSON.parse(result1.resultData), { a: 'b' })

        const result1Type = yield knex('ResultType as rt')
          .where({ id: result1.resultTypeId })
          .first('externalId')

        assert.equal(result1Type.externalId, 'Patient')

        const result1Source = yield knex('ResultSource as rs')
          .where({ id: result1.resultSourceId })
          .first('externalId')

        assert.equal(result1Source.externalId, 'DiagnosticDevice')

        const result1Status = yield knex('ResultWorkflowStatus as rs')
          .where({ id: result1.resultWorkflowStatusId })
          .first('externalId')

        assert.equal(result1Status.externalId, 'OK')

        const result1Sample = yield knex('Sample as s')
          .where({ id: result1.sampleId })
          .first()

        assert.equal(result1.siteId, result1Sample.originSiteId)
        assert.equal(result1Sample.collectedOn, null)
        assert.equal(result1Sample.sampleTypeId, null)

        const result1SampleSite = yield knex('Site as s')
          .where({ id: result1Sample.originSiteId })
          .first()

        assert.equal(result1.siteId, result1Sample.originSiteId)

        const result1Assay = yield knex('Assay as assay')
          .where({ id: result1.assayId })
          .first('externalId', 'name')

        assert.equal(result1Assay.externalId, 'HivVl')
        assert.equal(result1Assay.name, 'GeneXpert HIV VL')

        const [result1Category1, result1Category2] = yield knex(
          'ResultCategory as rt'
        )
          .whereIn('id', [result1.resultCategory1, result1.resultCategory2])
          .select('externalId')

        assert.equal(result1Category1.externalId, 'Success')
        assert.isNotOk(result1Category2)

        const [{ rawMessage: log1Raw, resultId: resultId1 }] = yield knex(
          'DeviceLog as dl'
        )
          .innerJoin('Result as r', 'r.id', 'dl.resultId')
          .where({ 'r.id': resultIds[0] })
          .select('rawMessage', 'resultId')

        assert.deepEqual(JSON.parse(log1Raw), {
          name: deviceChangedName,
          checkpoint: 'ck1',
          result: { data: { a: 'b' }, assay: { id: 'HivVl' } },
        })

        yield server
          .get(`${clientSingleResultPath}${resultId1}`)
          .set('Authorization', clientAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.typeOf(res.body.data, 'Object')
            assert.typeOf(res.body.data.resultData, 'Object')
            assert.deepEqual(res.body.data.resultData, { a: 'b' })
          })

        const { checkpoint: checkpoint1 } = yield knex('DeviceLog')
          .where({ deviceId })
          .orderBy('id', 'desc')
          .first('checkpoint')

        assert.equal(checkpoint1, 'ck1')

        yield server
          .get(`${devicePath}?checkpoint=ck0`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.equal(res.body.checkpoint, 'ck0')
            assert.typeOf(res.body.result, 'undefined')
          })

        yield setResultAsDeliverableAndApprove(context, resultId1)

        yield server
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

            assert.deepEqual(
              _.omit(lastResult, 'id', 'sample', 'workflow', 'location'),
              {
                data: { a: 'b' },
                assay: { id: 'HivVl' },
                category: [{ id: 'Success' }],
                type: { id: 'Patient' },
                source: { id: 'DiagnosticDevice' },
              }
            )
          })

        const result2SampleSite = yield knex('Site as s')
          .where('partnerId', result1SampleSite.partnerId)
          .where('id', '<>', result1.siteId)
          .first()

        yield server
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
              id: 'MtbRif',
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

        resultIds.push(yield* getLastResultId(knex, deviceId))

        const { checkpoint: checkpoint2 } = yield knex('DeviceLog')
          .where({ deviceId })
          .orderBy('id', 'desc')
          .first('checkpoint')
        assert.equal(checkpoint2, 'ck2')
        const [{ count: logLength2 }] = yield knex('DeviceLog').count(
          'id as count'
        )

        assert.equal(logLength2, initialLogLength + 4)

        yield server
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

        const result2 = yield knex('Result as r')
          .where({ 'r.id': resultIds[1] })
          .first()

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
          'My Awesome notes about this Awesome result!'
        )
        assert.equal(result2.errorCode, '123')
        assert.equal(result2.errorNotes, 'Oh NOZE!')

        const result2Type = yield knex('ResultType as rt')
          .where({ id: result2.resultTypeId })
          .first('externalId')
        assert.equal(result2Type.externalId, 'Study')

        const result2Source = yield knex('ResultSource as rs')
          .where({ id: result2.resultSourceId })
          .first('externalId')
        assert.equal(result2Source.externalId, 'EnteredByHand')

        const result2Status = yield knex('ResultWorkflowStatus as rs')
          .where({ id: result2.resultWorkflowStatusId })
          .first('externalId')
        assert.equal(result2Status.externalId, 'Acknowledged')

        const result2Assay = yield knex('Assay as assay')
          .where({ id: result2.assayId })
          .first('externalId', 'name')
        assert.equal(result2Assay.externalId, 'MtbRif')
        assert.equal(result2Assay.name, 'GeneXpert MTB/Rif')

        const result2Sample = yield knex('Sample as s')
          .where({ id: result2.sampleId })
          .first()
        assert.notEqual(result2.siteId, result2Sample.originSiteId)
        assert.equal(result2SampleSite.id, result2Sample.originSiteId)
        assert.equal(result2Sample.externalId, `Sample${now}`)

        const [result2Category1, result2Category2] = yield knex(
          'ResultCategory as rt'
        )
          .whereIn('id', [result2.resultCategory1, result2.resultCategory2])
          .select('externalId')
        assert.equal(result2Category1.externalId, 'Detected')
        assert.equal(result2Category2.externalId, 'Indeterminate')

        const [{ rawMessage: log2Raw, resultId: resultId2 }] = yield knex(
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
            id: 'MtbRif',
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
          notes: 'My Awesome notes about this Awesome result!',
          error: {
            code: '123',
            notes: 'Oh NOZE!',
          },
        })

        yield server
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

        yield server
          .get(`${devicePath}?checkpoint=ck1`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.equal(res.body.checkpoint, 'ck1')
            assert.typeOf(res.body.result, 'Object')
          })

        yield setResultAsDeliverableAndApprove(context, resultId2)

        yield server
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
            assert.deepEqual(_.omit(lastResult, 'id', 'location', 'workflow'), {
              data: { a: 'b', c: 2, d: false, e: { f: 'g' } },
              assay: {
                id: 'MtbRif',
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
              notes: 'My Awesome notes about this Awesome result!',
              error: {
                code: '123',
                notes: 'Oh NOZE!',
              },
            })
          })

        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({ name: deviceFirstName })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        yield server
          .get(`${devicePath}`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.equal(res.body.name, deviceFirstName)
          })
      }))

    it('should set default result status and categories', () =>
      runTest(function*(knex) {
        const resultIds = []
        const { deviceId, deviceAuth } = context

        yield server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            checkpoint: '3123',
            data: { a: 'b' },
            assay: { id: 'HivVl' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })

        resultIds.push(yield* getLastResultId(knex, deviceId))

        yield setResultAsDeliverableAndApprove(context, _.last(resultIds))

        yield server
          .get(`${devicePath}?checkpoint=3123`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.typeOf(res.body.result, 'Object')
            assert.deepEqual(res.body.result.data, { a: 'b' })
          })

        const result1 = yield knex('Result as r')
          .where({ id: resultIds[0] })
          .first()

        assert.deepEqual(JSON.parse(result1.resultData), { a: 'b' })
        assert.isNotOk(result1.errorCode)

        const result1Status = yield knex('ResultWorkflowStatus as rs')
          .where({ id: result1.resultWorkflowStatusId })
          .first('externalId')

        assert.equal(result1Status.externalId, 'Deliverable')

        const [result1Category1, result1Category2] = yield knex(
          'ResultCategory as rt'
        )
          .whereIn('id', [result1.resultCategory1, result1.resultCategory2])
          .select('externalId')
        assert.equal(result1Category1.externalId, 'Success')
        assert.isNotOk(result1Category2)

        yield server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            checkpoint: '312',
            data: { a: 'c' },
            error: { code: '1' },
            assay: { id: 'HivVl' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        resultIds.push(yield* getLastResultId(knex, deviceId))

        yield setResultAsDeliverableAndApprove(context, _.last(resultIds))

        yield server
          .get(`${devicePath}?checkpoint=312`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.typeOf(res.body.result, 'Object')
            assert.deepEqual(res.body.result.data, { a: 'c' })
            assert.deepEqual(res.body.result.error.code, '1')
          })

        const result2 = yield knex('Result as r')
          .where({ id: resultIds[1] })
          .first()

        assert.deepEqual(JSON.parse(result2.resultData), { a: 'c' })
        assert.equal(result2.errorCode, '1')

        const result2Status = yield knex('ResultWorkflowStatus as rs')
          .where({ id: result2.resultWorkflowStatusId })
          .first('externalId')

        assert.equal(result2Status.externalId, 'Deliverable')

        const [result2Category1, result2Category2] = yield knex(
          'ResultCategory as rt'
        )
          .whereIn('id', [result2.resultCategory1, result2.resultCategory2])
          .select('externalId')
        assert.equal(result2Category1.externalId, 'Error')
        assert.isNotOk(result2Category2)

        yield server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            data: { a: 'd' },
            category: { id: 'Invalid' },
            error: { code: '1' },
            assay: { id: 'HivVl' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        resultIds.push(yield* getLastResultId(knex, deviceId))

        const result3 = yield knex('Result as r')
          .where({ id: resultIds[2] })
          .first()
        assert.deepEqual(JSON.parse(result3.resultData), { a: 'd' })
        assert.equal(result3.errorCode, '1')

        const result3Status = yield knex('ResultWorkflowStatus as rs')
          .where({ id: result3.resultWorkflowStatusId })
          .first('externalId')
        assert.equal(result3Status.externalId, 'Error')

        const [result3Category1, result3Category2] = yield knex(
          'ResultCategory as rt'
        )
          .whereIn('id', [result3.resultCategory1, result3.resultCategory2])
          .select('externalId')
        assert.equal(result3Category1.externalId, 'Invalid')
        assert.isNotOk(result3Category2)

        yield server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            checkpoint: '31',
            data: { a: 'e' },
            category: [{ id: 'Detected' }, { id: 'NotDetected' }],
            assay: { id: 'HivVl' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        resultIds.push(yield* getLastResultId(knex, deviceId))

        yield setResultAsDeliverableAndApprove(context, _.last(resultIds))

        yield server
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

        const result4 = yield knex('Result as r')
          .where({ id: resultIds[3] })
          .first()
        assert.deepEqual(JSON.parse(result4.resultData), { a: 'e' })
        assert.isNotOk(result4.errorCode)

        const result4Status = yield knex('ResultWorkflowStatus as rs')
          .where({ id: result4.resultWorkflowStatusId })
          .first('externalId')
        assert.equal(result4Status.externalId, 'Deliverable')

        const [result4Category1, result4Category2] = yield knex(
          'ResultCategory as rt'
        )
          .whereIn('id', [result4.resultCategory1, result4.resultCategory2])
          .select('externalId')
        assert.equal(result4Category1.externalId, 'Detected')
        assert.equal(result4Category2.externalId, 'NotDetected')
      }))

    it('should merge results with same id', () =>
      runTest(function*(knex) {
        const { deviceId, deviceAuth } = context

        const resultIds = []
        const resultExternalIds = []
        resultExternalIds.push(`R1${now}`, `R2${now}`)
        const countResults = () =>
          knex('Result')
            .count('id as cnt')
            .then(([{ cnt }]) => cnt)
        const initialCount = yield countResults()

        yield server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            id: resultExternalIds[0],
            data: { a: 'b' },
            assay: { id: 'HivVl' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        resultIds.push(yield* getLastResultId(knex, deviceId))

        let result1 = yield knex('Result as r')
          .where({ id: resultIds[0] })
          .first()
        assert.equal(result1.externalId, resultExternalIds[0])
        assert.deepEqual(JSON.parse(result1.resultData), { a: 'b' })
        assert.isNotOk(result1.errorCode)
        assert.equal(initialCount + 1, yield countResults())

        yield server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            id: resultExternalIds[0],
            data: { a: 'b', c: 'd' },
            assay: { id: 'HivVl' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        let lastResultId = yield* getLastResultId(knex, deviceId)
        assert.equal(lastResultId, resultIds[0])

        result1 = yield knex('Result as r')
          .where({ id: resultIds[0] })
          .first()
        assert.equal(result1.externalId, resultExternalIds[0])
        assert.deepEqual(JSON.parse(result1.resultData), { a: 'b', c: 'd' })
        assert.isNotOk(result1.errorCode)
        assert.equal(initialCount + 1, yield countResults())

        yield server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            id: resultExternalIds[1],
            data: { a: 'b' },
            assay: { id: 'HivVl' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        lastResultId = yield* getLastResultId(knex, deviceId)
        assert.notEqual(lastResultId, resultIds[0])
        resultIds.push(lastResultId)

        let result2 = yield knex('Result as r')
          .where({ id: resultIds[1] })
          .first()
        assert.equal(result2.externalId, resultExternalIds[1])
        assert.equal(initialCount + 2, yield countResults())

        const result1SampleSite = yield knex('Site as s')
          .where({ id: result1.siteId })
          .first()

        const result2SampleSite = yield knex('Site as s')
          .where('partnerId', result1SampleSite.partnerId)
          .where('id', '<>', result1.siteId)
          .first()

        yield server
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
              id: 'MtbRif',
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

        lastResultId = yield* getLastResultId(knex, deviceId)
        assert.equal(lastResultId, resultIds[1])

        result2 = yield knex('Result as r')
          .where({ id: resultIds[1] })
          .first()
        assert.equal(initialCount + 2, yield countResults())
        assert.equal(result2.externalId, resultExternalIds[1])
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

        const result2Type = yield knex('ResultType as rt')
          .where({ id: result2.resultTypeId })
          .first('externalId')
        assert.equal(result2Type.externalId, 'Study')

        const result2Source = yield knex('ResultSource as rs')
          .where({ id: result2.resultSourceId })
          .first('externalId')
        assert.equal(result2Source.externalId, 'EnteredByHand')

        const result2Status = yield knex('ResultWorkflowStatus as rs')
          .where({ id: result2.resultWorkflowStatusId })
          .first('externalId')
        assert.equal(result2Status.externalId, 'Acknowledged')

        const result2Assay = yield knex('Assay as assay')
          .where({ id: result2.assayId })
          .first('externalId', 'name')
        assert.equal(result2Assay.externalId, 'MtbRif')
        assert.equal(result2Assay.name, 'GeneXpert MTB/Rif')

        const result2Sample = yield knex('Sample as s')
          .where({ id: result2.sampleId })
          .first()

        assert.notEqual(result2.siteId, result2Sample.originSiteId)
        assert.equal(result2SampleSite.id, result2Sample.originSiteId)
        assert.equal(result2Sample.externalId, `Sample${now}`)

        const [result2Category1, result2Category2] = yield knex(
          'ResultCategory as rt'
        )
          .whereIn('id', [result2.resultCategory1, result2.resultCategory2])
          .select('externalId')
        assert.equal(result2Category1.externalId, 'Detected')
        assert.equal(result2Category2.externalId, 'Indeterminate')
      }))

    it('should add and return device data', () =>
      runTest(function*(knex) {
        const { deviceId, deviceAuth } = context
        const resultIds = []
        const opIds = []

        const [{ count: initialLogLength }] = yield knex('DeviceLog').count(
          'id as count'
        )

        yield server
          .get(devicePath)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body.result, 'undefined')
            assert.property(res.body, 'checkpoint')
          })

        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({ checkpoint: 'ck000' })

        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            checkpoint: 'ck123',
            configuration: { data: { a: 'b' } },
            operation: { data: { a: 'c' } },
            result: { data: { a: 'd' }, assay: { id: 'HivVl' } },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        resultIds.push(yield* getLastResultId(knex, deviceId))
        opIds.push(yield* getLastDeviceOperationId(knex, deviceId))

        const [{ count: logLength2 }] = yield knex('DeviceLog').count(
          'id as count'
        )
        assert.equal(logLength2, initialLogLength + 2)

        const deviceLogResult2 = yield knex('Result')
          .where({ id: resultIds[resultIds.length - 1] })
          .first()
        const deviceLogConfig2 = yield* getDeviceConfigurationData(
          knex,
          deviceId
        )
        const deviceLogOp2 = yield knex('DeviceOperation')
          .where({ id: opIds[opIds.length - 1] })
          .first()
        assert.deepEqual(deviceLogConfig2, _.assign({}, baseConfig, { a: 'b' }))
        assert.property(deviceLogOp2, 'data')
        assert.deepEqual(JSON.parse(deviceLogOp2.data), { a: 'c' })
        assert.property(deviceLogResult2, 'resultData')
        assert.deepEqual(JSON.parse(deviceLogResult2.resultData), { a: 'd' })
        const deviceLogUpdates2 = yield knex('DeviceLog').where({
          deviceConfigurationUpdated: true,
          deviceOperationId: deviceLogOp2.id,
        })

        assert.equal(deviceLogUpdates2.length, 1)
        assert.isOk(deviceLogUpdates2[0].id)
        assert.equal(deviceLogUpdates2[0].resultId, deviceLogResult2.id)

        yield setResultAsDeliverableAndApprove(context, _.last(resultIds))

        yield server
          .get(devicePath)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.equal(res.body.checkpoint, 'ck123')
            assert.typeOf(res.body.result, 'Object')
          })

        yield server
          .get(`${devicePath}?checkpoint=ck000`)
          .set('Authorization', deviceAuth)
          .then(res => {
            // does not include result uploaded with previous checkpoint
            assert.equal(res.status, 200)
            assert.equal(res.body.checkpoint, 'ck000')
            assert.typeOf(res.body.result, 'undefined')
          })

        yield server
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

        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            checkpoint: 'ck234',
            configuration: { data: { a: 'c' } },
            operation: { data: { a: 'd' } },
            result: { data: { a: 'd' }, assay: { id: 'HivVl' } },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        resultIds.push(yield* getLastResultId(knex, deviceId))
        opIds.push(yield* getLastDeviceOperationId(knex, deviceId))

        const [{ count: logLength3 }] = yield knex('DeviceLog').count(
          'id as count'
        )

        assert.equal(logLength3, initialLogLength + 4) // previous + 1 result

        const deviceLogConfig3 = yield* getDeviceConfigurationData(
          knex,
          deviceId
        )
        const deviceLogOp3 = yield knex('DeviceOperation')
          .where({ id: opIds[opIds.length - 1] })
          .first()

        assert.deepEqual(deviceLogConfig3, _.assign({}, baseConfig, { a: 'c' }))
        assert.property(deviceLogOp3, 'data')
        assert.deepEqual(JSON.parse(deviceLogOp3.data), { a: 'd' })

        const deviceLogUpdates3 = yield knex('DeviceLog').where({
          deviceConfigurationUpdated: true,
          deviceOperationId: deviceLogOp3.id,
        })

        assert.equal(deviceLogUpdates3.length, 1)
        assert.isOk(deviceLogUpdates3[0].id)
        assert.isOk(deviceLogUpdates3[0].resultId)

        yield setResultAsDeliverableAndApprove(context, _.last(resultIds))

        yield server
          .get(devicePath)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body.result, 'Object')
            assert.equal(res.body.checkpoint, 'ck234')
          })

        yield server
          .get(`${devicePath}?checkpoint=ck234`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body.result, 'Object')
            assert.equal(res.body.checkpoint, 'ck234')
          })

        yield server
          .get(`${devicePath}?checkpoint=ck123`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body.result, 'Object')
            assert.equal(res.body.checkpoint, 'ck123')
          })

        yield server
          .get(`${devicePath}?checkpoint=ck000`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body.result, 'undefined')
            assert.equal(res.body.checkpoint, 'ck000')
          })
      }))

    describe('inventory management', () => {
      function getInventoryItemsAtSite(knex, siteId) {
        return knex('InventoryItem')
          .where({ siteId })
          .select('consumableId', 'lotNumber', 'expiresOn', 'quantityOnHand')
      }

      it('should deduct inventory levels from the site', () =>
        runTest(function*(knex) {
          const results = [
            {
              assayExternalId: 'MtbRif',
              cartridgeName: 'GeneXpert TB Cartridge',
              deviceId: context.deviceId,
            },
            {
              assayExternalId: 'Ebola',
              cartridgeName: 'GeneXpert Ebola Cartridge',
              deviceId: context.deviceId,
            },
          ]

          for (const resultDetails of results) {
            const { siteId } = yield knex('Device')
              .where({ id: resultDetails.deviceId })
              .first('siteId')
            const cartridgeId = (yield knex('Consumable')
              .where({ name: resultDetails.cartridgeName })
              .first('id')).id

            const inventoryItemsBefore = yield getInventoryItemsAtSite(
              knex,
              siteId
            )
            const firstCartridgeConsumable = _.find(inventoryItemsBefore, {
              consumableId: cartridgeId,
            })
            if (!firstCartridgeConsumable) {
              // No cartridge in this site.
              continue // eslint-disable-line no-continue
            }
            const assayConsumables = yield knex('ConsumableAssay as ca')
              .join('Assay as a', 'ca.assayId', 'a.id')
              .where('a.externalId', resultDetails.assayExternalId)
              .select('ca.consumableId', 'ca.assayId', 'ca.quantity')

            yield server
              .post(devicePostResultPath)
              .set('Authorization', context.deviceAuth)
              .send({
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

            const inventoryItemsAfter = yield getInventoryItemsAtSite(
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
                  inventoryItemBefore.quantityOnHand - assayConsumable.quantity
                )
              }
            })
          }
        }))

      it('should try to deduct the correct inventory item based on expiration date and lot number', () =>
        runTest(function*(knex) {
          const { deviceId, deviceAuth } = context
          const { siteId } = yield knex('Device')
            .where({ id: deviceId })
            .first('siteId')
          const { id: adminId } = yield knex('User')
            .where({ name: context.auth.user })
            .first('id')
          const assayExternalId = 'MtbRif'
          const mtbRifCartridgeId = (yield knex('Consumable as c')
            .where('c.name', 'GeneXpert TB Cartridge')
            .first('c.id')).id

          let resultDetails = {
            lotNumber: 'ABC123',
            expirationDate: '2045-01-30T00:00:00+00:00',
          }

          const [lotNumberAndExpirationDateMatch] = yield knex(
            'InventoryItem'
          ).insert({
            consumableId: mtbRifCartridgeId,
            siteId,
            lotNumber: resultDetails.lotNumber,
            expiresOn: new Date(resultDetails.expirationDate),
            quantityOnHand: 20,
            createdBy: adminId,
            createdOn: now,
            updatedBy: adminId,
            updatedOn: now,
          })

          const inventoryConsumedByTest = (yield knex('ConsumableAssay as ca')
            .join('Assay as a', 'ca.assayId', 'a.id')
            .where('a.externalId', assayExternalId)
            .andWhere('ca.consumableId', mtbRifCartridgeId)
            .first('ca.quantity')).quantity

          let cartridgeAtSiteBefore = _.find(
            yield getInventoryItemsAtSite(knex, siteId),
            inventoryItem =>
              inventoryItem.lotNumber === resultDetails.lotNumber &&
              inventoryItem.expiresOn.toJSON() ===
                new Date(resultDetails.expirationDate).toJSON()
          )

          yield server
            .post(devicePostResultPath)
            .set('Authorization', deviceAuth)
            .send({
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

          let cartridgeAtSiteAfter = _.find(
            yield getInventoryItemsAtSite(knex, siteId),
            inventoryItem =>
              inventoryItem.lotNumber === resultDetails.lotNumber &&
              inventoryItem.expiresOn.toJSON() ===
                new Date(resultDetails.expirationDate).toJSON()
          )

          assert.equal(
            cartridgeAtSiteAfter.quantityOnHand,
            cartridgeAtSiteBefore.quantityOnHand - inventoryConsumedByTest
          )

          resultDetails = {
            lotNumber: 'XYZ321',
            expirationDate: '2035-01-30T00:00:00+00:00',
          }
          const randomExpiryDate = new Date('2017-03-05T00:00:00+00:00')
          const [onlyLotNumberMatches] = yield knex('InventoryItem').insert({
            consumableId: mtbRifCartridgeId,
            siteId,
            lotNumber: resultDetails.lotNumber,
            expiresOn: randomExpiryDate,
            quantityOnHand: 30,
            createdBy: adminId,
            createdOn: now,
            updatedBy: adminId,
            updatedOn: now,
          })
          cartridgeAtSiteBefore = _.find(
            yield getInventoryItemsAtSite(knex, siteId),
            inventoryItem =>
              inventoryItem.lotNumber === resultDetails.lotNumber &&
              inventoryItem.expiresOn.toJSON() ===
                new Date(randomExpiryDate).toJSON()
          )

          yield server
            .post(devicePostResultPath)
            .set('Authorization', deviceAuth)
            .send({
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

          cartridgeAtSiteAfter = _.find(
            yield getInventoryItemsAtSite(knex, siteId),
            inventoryItem =>
              inventoryItem.lotNumber === resultDetails.lotNumber &&
              inventoryItem.expiresOn.toJSON() ===
                new Date(randomExpiryDate).toJSON()
          )

          assert.equal(
            cartridgeAtSiteAfter.quantityOnHand,
            cartridgeAtSiteBefore.quantityOnHand - inventoryConsumedByTest
          )

          resultDetails = {
            lotNumber: 'ABC123',
            expirationDate: '2019-11-16T00:00:00+00:00',
          }
          const randomLotNumber = 'RANDOM-LOT'
          const [onlyExpirationDateMatches] = yield knex(
            'InventoryItem'
          ).insert({
            consumableId: mtbRifCartridgeId,
            siteId,
            lotNumber: randomLotNumber,
            expiresOn: new Date(resultDetails.expirationDate),
            quantityOnHand: 45,
            createdBy: adminId,
            createdOn: now,
            updatedBy: adminId,
            updatedOn: now,
          })
          cartridgeAtSiteBefore = _.find(
            yield getInventoryItemsAtSite(knex, siteId),
            inventoryItem =>
              inventoryItem.lotNumber === randomLotNumber &&
              inventoryItem.expiresOn.toJSON() ===
                new Date(resultDetails.expirationDate).toJSON()
          )

          yield server
            .post(devicePostResultPath)
            .set('Authorization', deviceAuth)
            .send({
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

          cartridgeAtSiteAfter = _.find(
            yield getInventoryItemsAtSite(knex, siteId),
            inventoryItem =>
              inventoryItem.lotNumber === randomLotNumber &&
              inventoryItem.expiresOn.toJSON() ===
                new Date(resultDetails.expirationDate).toJSON()
          )

          assert.equal(
            cartridgeAtSiteAfter.quantityOnHand,
            cartridgeAtSiteBefore.quantityOnHand - inventoryConsumedByTest
          )

          yield knex('InventoryLog')
            .whereIn('inventoryItemId', [
              lotNumberAndExpirationDateMatch,
              onlyLotNumberMatches,
              onlyExpirationDateMatches,
            ])
            .del()
          yield knex('InventoryItem')
            .whereIn('id', [
              lotNumberAndExpirationDateMatch,
              onlyLotNumberMatches,
              onlyExpirationDateMatches,
            ])
            .del()
        }))

      it('should try to deduct the correct inventory item based on expiration date over lot number', () =>
        runTest(function*(knex) {
          const { deviceId, deviceAuth } = context
          const { siteId } = yield knex('Device')
            .where({ id: deviceId })
            .first('siteId')
          const { id: adminId } = yield knex('User')
            .where({ name: context.auth.user })
            .first('id')
          const assayExternalId = 'MtbRif'
          const mtbRifCartridgeId = (yield knex('Consumable as c')
            .where('c.name', 'GeneXpert TB Cartridge')
            .first('c.id')).id
          const inventoryConsumedByTest = (yield knex('ConsumableAssay as ca')
            .join('Assay as a', 'ca.assayId', 'a.id')
            .where('a.externalId', assayExternalId)
            .andWhere('ca.consumableId', mtbRifCartridgeId)
            .first('ca.quantity')).quantity

          const resultDetails = {
            lotNumber: 'QWE987',
            expirationDate: '2017-12-16T00:00:00+00:00',
          }
          const randomExpiryDate = new Date('2017-03-05T00:00:00+00:00')
          const [onlyLotNumberMatches] = yield knex('InventoryItem').insert({
            consumableId: mtbRifCartridgeId,
            siteId,
            lotNumber: resultDetails.lotNumber,
            expiresOn: randomExpiryDate,
            quantityOnHand: 30,
            createdBy: adminId,
            createdOn: now,
            updatedBy: adminId,
            updatedOn: now,
          })
          const randomLotNumber = 'SOME-LOT-NUMBER'
          const [onlyExpirationDateMatches] = yield knex(
            'InventoryItem'
          ).insert({
            consumableId: mtbRifCartridgeId,
            siteId,
            lotNumber: randomLotNumber,
            expiresOn: new Date(resultDetails.expirationDate),
            quantityOnHand: 45,
            createdBy: adminId,
            createdOn: now,
            updatedBy: adminId,
            updatedOn: now,
          })
          const inventoryItemsBefore = yield getInventoryItemsAtSite(
            knex,
            siteId
          )
          const matchingLotNumberCartridgeAtSiteBefore = _.find(
            inventoryItemsBefore,
            inventoryItem =>
              inventoryItem.lotNumber === resultDetails.lotNumber &&
              inventoryItem.expiresOn.toJSON() ===
                new Date(randomExpiryDate).toJSON()
          )
          const matchingExpirationDateCartridgeAtSiteBefore = _.find(
            inventoryItemsBefore,
            inventoryItem =>
              inventoryItem.lotNumber === randomLotNumber &&
              inventoryItem.expiresOn.toJSON() ===
                new Date(resultDetails.expirationDate).toJSON()
          )

          yield server
            .post(devicePostResultPath)
            .set('Authorization', deviceAuth)
            .send({
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

          const inventoryItemsAfter = yield getInventoryItemsAtSite(
            knex,
            siteId
          )
          const matchingLotNumberCartridgeAtSiteAfter = _.find(
            inventoryItemsAfter,
            inventoryItem =>
              inventoryItem.lotNumber === resultDetails.lotNumber &&
              inventoryItem.expiresOn.toJSON() ===
                new Date(randomExpiryDate).toJSON()
          )
          const matchingExpirationDateCartridgeAtSiteAfter = _.find(
            inventoryItemsAfter,
            inventoryItem =>
              inventoryItem.lotNumber === randomLotNumber &&
              inventoryItem.expiresOn.toJSON() ===
                new Date(resultDetails.expirationDate).toJSON()
          )

          assert.equal(
            matchingLotNumberCartridgeAtSiteAfter.quantityOnHand,
            matchingLotNumberCartridgeAtSiteBefore.quantityOnHand
          )

          assert.equal(
            matchingExpirationDateCartridgeAtSiteAfter.quantityOnHand,
            matchingExpirationDateCartridgeAtSiteBefore.quantityOnHand -
              inventoryConsumedByTest
          )

          yield knex('InventoryLog')
            .whereIn('inventoryItemId', [
              onlyLotNumberMatches,
              onlyExpirationDateMatches,
            ])
            .del()
          yield knex('InventoryItem')
            .whereIn('id', [onlyLotNumberMatches, onlyExpirationDateMatches])
            .del()
        }))

      it('should log inventory consumption, even when no inventory item exists for site', () =>
        runTest(function*(knex) {
          const { deviceId, deviceAuth } = context
          const { siteId } = yield knex('Device')
            .where({ id: deviceId })
            .first('siteId')
          const assayExternalId = 'Ebola'
          const ebolaCartridgeId = (yield knex('Consumable as c')
            .where('c.name', 'GeneXpert Ebola Cartridge')
            .first('c.id')).id
          const inventoryConsumedByTest = (yield knex('ConsumableAssay as ca')
            .join('Assay as a', 'ca.assayId', 'a.id')
            .where('a.externalId', assayExternalId)
            .andWhere('ca.consumableId', ebolaCartridgeId)
            .first('ca.quantity')).quantity

          const resultDetails = {
            lotNumber: 'EBO533',
            expirationDate: new Date(
              new Date(
                new Date().getTime() + _.random(0, 1000 * 60 * 60 * 24 * 365)
              ).setHours(0, 0, 0, 0)
            ).toJSON(),
          }
          const inventoryItemsBefore = yield getInventoryItemsAtSite(
            knex,
            siteId
          )

          yield server
            .post(devicePostResultPath)
            .set('Authorization', deviceAuth)
            .send({
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

          const inventoryItemsAfter = yield getInventoryItemsAtSite(
            knex,
            siteId
          )

          assert.deepEqual(inventoryItemsAfter, inventoryItemsBefore)

          const inventoryConsumptionLog = yield knex('InventoryLog as il')
            .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
            .where('il.consumableId', ebolaCartridgeId)
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

          assert.isNull(inventoryConsumptionLog.inventoryItemId)
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
            inventoryConsumptionLog.expiresOn.toJSON(),
            resultDetails.expirationDate
          )
          assert.equal(
            inventoryConsumptionLog.quantity,
            -inventoryConsumedByTest
          )

          const {
            count: otherInventoryConsumptionLogsForThisTest,
          } = yield knex('InventoryLog')
            .whereNot({ id: inventoryConsumptionLog.id })
            .andWhere({ siteId, createdOn: inventoryConsumptionLog.createdOn })
            .count('id as count')

          assert.isNotOk(otherInventoryConsumptionLogsForThisTest)

          yield knex('InventoryLog')
            .andWhere({ resultId: inventoryConsumptionLog.resultId })
            .del()
        }))
    })

    describe('fact tables', () => {
      function getDeviceResultCounts(knex, deviceId) {
        return knex('FactResultCountDevice')
          .where({ deviceId })
          .andWhere('resultCategory1', null)
          .select(
            'deviceId',
            'assayId',
            'resultCategory1',
            'days',
            'resultCount',
            'calculatedOn'
          )
      }

      it('should update the result counts in the facts-table when a new result is reported', () =>
        runTest(function*(knex) {
          const resultDetails = {
            assayExternalId: 'MtbRif',
            deviceId: context.deviceId,
          }

          const resultCountsBefore = yield getDeviceResultCounts(
            knex,
            context.deviceId
          )

          const { id: assayId } = yield knex('Assay')
            .where('externalId', resultDetails.assayExternalId)
            .first('id')

          yield server
            .post(devicePostResultPath)
            .set('Authorization', context.deviceAuth)
            .send({
              id: new Date().getTime().toString(),
              data: { a: 'b' },
              assay: { id: resultDetails.assayExternalId },
              endedOn: new Date(),
            })
            .then(res => {
              assert.equal(res.status, 200)
              return waitAsyncComplete(res)
            })

          const resultCountsAfter = yield getDeviceResultCounts(
            knex,
            context.deviceId
          )

          resultCountsBefore.forEach(countBefore => {
            const countAfter = _.find(resultCountsAfter, {
              days: countBefore.days,
              assayId: countBefore.assayId,
              resultCategory1: countBefore.resultCategory1,
            })

            // compare before and after counts
            if (countAfter) {
              if (countAfter.assayId === assayId || !countAfter.assayId) {
                assert.equal(
                  countAfter.resultCount,
                  countBefore.resultCount + 1,
                  'Count in fact-table should have increased by one after posting a result'
                )
              } else {
                assert.equal(
                  countBefore.resultCount,
                  countAfter.resultCount,
                  'Count in fact-table should be the same as before for rows that are not assigned to the posted assay.'
                )
              }
            }
          })
        }))
    })
  })

  describe('RRT Lab/Clinic Tests', () => {
    const context = createTestContext(server, {
      user: 'rrt_admin',
      partner: 'RRT',
    })

    const { runTest } = context

    beforeEach(context.beforeEach)
    afterEach(context.afterEach)

    it('should create Device on first post with API Key', () =>
      runTest(function*(knex) {
        const { apiKey, deviceAuth } = context
        assert.isOk(apiKey)
        const device1 = yield* getDeviceFromApiKey(knex, apiKey)
        assert.isNotOk(device1)
        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({ type: { id: 'CHAI' }, site: { id: 'CHIZ' } })
          .then(res => {
            assert.equal(res.status, 200)
          })
        const device2 = yield* getDeviceFromApiKey(knex, apiKey)
        assert.isOk(device2)
        assert.isOk(device2.name)
        assert.equal(device2.serial, null)

        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({ name: 'MY AWESOME DEVICE!', serial: 'DO NOT CHANGE SERIAL' })
          .then(res => {
            assert.equal(res.status, 200)
          })

        const device3 = yield* getDeviceFromApiKey(knex, apiKey)
        assert.isOk(device3)
        assert.equal(device3.id, device2.id)
        assert.equal(device3.serial, null)
        assert.equal(device3.name, 'MY AWESOME DEVICE!')
      }))

    it('should create Device on first post with API Key and serial', () =>
      runTest(function*(knex) {
        const { apiKey, deviceAuth } = context
        assert.isOk(apiKey)
        const device1 = yield* getDeviceFromApiKey(knex, apiKey)
        assert.isNotOk(device1)
        const serial = 'OMAN-123456'
        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({ serial, type: { id: 'CHAILIMS' }, site: { id: 'CHIZ' } })
          .then(res => {
            assert.equal(res.status, 200)
          })
        const device2 = yield* getDeviceFromApiKey(knex, apiKey)
        assert.isOk(device2)
        assert.equal(device2.serial, serial)
        assert.equal(device2.name, serial)
      }))

    it('should create Device on first post with API Key and serial', () =>
      runTest(function*(knex) {
        const { apiKey, deviceAuth } = context
        assert.isOk(apiKey)
        const device1 = yield* getDeviceFromApiKey(knex, apiKey)
        assert.isNotOk(device1)

        const serial = 'OMAN-123457'
        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            serial,
            type: { id: 'CHAILIMS' },
            site: { id: 'CHIZ' },
            name: 'SHINY NEW',
            operation: { data: { a: 'basd' } },
            configuration: { data: { as: 'df' } },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
        const device2 = yield* getDeviceFromApiKey(knex, apiKey)
        assert.isOk(device2)
        assert.isOk(device2.id)
        assert.equal(device2.serial, serial)
        assert.equal(device2.name, 'SHINY NEW')

        assert.deepEqual(JSON.parse(device2.configurationData), { as: 'df' })
        const config2 = yield* getDeviceConfigurationData(knex, device2.id)
        assert.deepEqual(config2, { as: 'df' })
        const op2 = yield* getLastDeviceOperationData(knex, device2.id)
        assert.deepEqual(op2, { a: 'basd' })
      }))

    it('should honor device sample origin site', () =>
      runTest(function*(knex) {
        const { deviceAuth, apiKey: labKey } = context

        let deviceLab = yield* getDeviceFromApiKey(knex, labKey)
        assert.isNotOk(deviceLab)

        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            checkpoint: 'rrt_0',
            type: { id: 'CHAILIMS' },
            site: { id: 'CHIZ' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })

        const device1315Key = yield* context.createApiKey(knex)
        const device1723Key = yield* context.createApiKey(knex)

        deviceLab = yield* getDeviceFromApiKey(knex, labKey)
        let device1315 = yield* getDeviceFromApiKey(knex, device1315Key)
        let device1723 = yield* getDeviceFromApiKey(knex, device1723Key)
        assert.isOk(deviceLab)
        assert.isNotOk(device1315)
        assert.isNotOk(device1723)

        context.apiKeysWithoutDevice.push(device1315Key, device1723Key)
        const device1315Auth = `Bearer ${device1315Key.token}`
        const device1723Auth = `Bearer ${device1723Key.token}`

        const device1315ExternalId = `1315-${new Date()}`
        const device1723ExternalId = `1723-${new Date()}`

        deviceLab = yield* getDeviceFromApiKey(knex, labKey)
        device1315 = yield* getDeviceFromApiKey(knex, device1315Key)
        device1723 = yield* getDeviceFromApiKey(knex, device1723Key)
        assert.isOk(deviceLab)
        assert.isNotOk(device1315)
        assert.isNotOk(device1723)

        yield server
          .post(devicePath)
          .set('Authorization', device1315Auth)
          .send({
            checkpoint: 'rrt1315_0',
            type: { id: 'AspectReporter' },
            site: { id: '1315' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })

        deviceLab = yield* getDeviceFromApiKey(knex, labKey)
        device1315 = yield* getDeviceFromApiKey(knex, device1315Key)
        device1723 = yield* getDeviceFromApiKey(knex, device1723Key)
        assert.isOk(deviceLab)
        assert.isOk(device1315)
        assert.isNotOk(device1723)

        yield server
          .post(devicePath)
          .set('Authorization', device1723Auth)
          .send({
            checkpoint: 'rrt1723_0',
            type: { id: 'AspectReporter' },
            site: { id: '1723' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })

        deviceLab = yield* getDeviceFromApiKey(knex, labKey)
        device1315 = yield* getDeviceFromApiKey(knex, device1315Key)
        device1723 = yield* getDeviceFromApiKey(knex, device1723Key)
        assert.isOk(deviceLab)
        assert.isOk(device1315)
        assert.isOk(device1723)

        yield server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            id: device1315ExternalId,
            checkpoint: 'rrt_1',
            data: {
              resultText: '454112',
              copies: 454112,
            },
            patient: {
              name: 'Bob',
              surname: 'Hope',
              age: 312,
              gender: 'M',
              artNumber: '1341kjkj',
            },
            sample: {
              originSite: {
                id: '1315',
              },
            },
            assay: { id: 'HivVl' },
            workflow: { status: { id: 'Validated' } },
            notes: '454,112 Copies / mL',
          })
          .then(res => {
            assert.equal(res.status, 200)
          })

        yield waitAsyncComplete()
        let lastResultId = yield* getLastResultId(knex, deviceLab.id)
        let lastResult = yield knex('Result as r')
          .join(
            'ResultWorkflowStatus as rws',
            'r.resultWorkflowStatusId',
            'rws.id'
          )
          .where({ 'r.id': lastResultId })
          .first('r.qcCheck', 'rws.externalId as workflow')
        assert.deepEqual(lastResult, { qcCheck: 1, workflow: 'Deliverable' })

        yield server
          .get(`${devicePath}?checkpoint=rrt_0`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.equal(res.body.checkpoint, 'rrt_0')
            assert.typeOf(res.body.result, 'undefined')
          })

        yield server
          .get(`${devicePath}?checkpoint=rrt_1`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.equal(res.body.checkpoint, 'rrt_1')

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1315')
            assert.property(lastResult.workflow, 'changedOn')
            assert.equal(lastResult.workflow.status.id, 'Delivered')

            assert.deepEqual(
              _.omit(lastResult, 'sample', 'workflow', 'location'),
              {
                id: device1315ExternalId,
                data: {
                  resultText: '454112',
                  copies: 454112,
                },
                patient: {
                  name: 'Bob',
                  surname: 'Hope',
                  age: 312,
                  gender: 'M',
                  artNumber: '1341kjkj',
                },
                assay: { id: 'HivVl' },
                category: [{ id: 'MoreThan1000' }],
                type: { id: 'Patient' },
                source: { id: 'LIMS' },
                notes: '454,112 Copies / mL',
              }
            )
          })

        yield server
          .get(`${devicePath}?checkpoint=rrt_0&offset=1`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.equal(res.body.checkpoint, 'rrt_1')

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1315')
            assert.property(lastResult.workflow, 'changedOn')
            assert.equal(lastResult.workflow.status.id, 'Delivered')

            assert.deepEqual(_.omit(lastResult, 'sample', 'workflow'), {
              id: device1315ExternalId,
              data: {
                resultText: '454112',
                copies: 454112,
              },
              patient: {
                name: 'Bob',
                surname: 'Hope',
                age: 312,
                gender: 'M',
                artNumber: '1341kjkj',
              },
              assay: { id: 'HivVl' },
              category: [{ id: 'MoreThan1000' }],
              type: { id: 'Patient' },
              source: { id: 'LIMS' },
              notes: '454,112 Copies / mL',
            })
          })

        yield server
          .get(`${devicePath}?checkpoint=rrt1315_0&offset=1`)
          .set('Authorization', device1315Auth)
          .then(res => {
            assert.equal(res.status, 200)
            // no checkpoint for this Device (even though there is for the Lab)
            assert.typeOf(res.body.checkpoint, 'undefined')

            const lastResult = res.body.result
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1315')
            assert.property(lastResult.workflow, 'changedOn')

            assert.deepEqual(
              _.omit(lastResult, 'sample', 'workflow', 'location'),
              {
                id: device1315ExternalId,
                data: {
                  resultText: '454112',
                  copies: 454112,
                },
                patient: {
                  name: 'Bob',
                  surname: 'Hope',
                  age: 312,
                  gender: 'M',
                  artNumber: '1341kjkj',
                },
                assay: { id: 'HivVl' },
                category: [{ id: 'Success' }],
                type: { id: 'Patient' },
                source: { id: 'Generated' },
              }
            )
          })

        yield server
          .get(`${devicePath}?checkpoint=rrt1723_0&offset=1`)
          .set('Authorization', device1723Auth)
          .then(res => {
            // no checkpoint at this offset
            assert.equal(res.status, 404)
          })

        yield server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            id: device1723ExternalId,
            checkpoint: 'rrt_2',
            data: {
              resultText: '154112',
              copies: 154112,
            },
            patient: {
              name: 'Fran',
              surname: 'Love',
              age: 231,
              gender: 'F',
              artNumber: '2341sfkj',
            },
            sample: {
              originSite: {
                id: '1723',
              },
            },
            assay: { id: 'HivVl' },
            workflow: { status: { id: 'Validated' } },
            notes: '154,112 Copies / mL',
          })
          .then(res => {
            assert.equal(res.status, 200)
          })

        yield waitAsyncComplete()
        lastResultId = yield* getLastResultId(knex, deviceLab.id)
        lastResult = yield knex('Result as r')
          .join(
            'ResultWorkflowStatus as rws',
            'r.resultWorkflowStatusId',
            'rws.id'
          )
          .where({ 'r.id': lastResultId })
          .first('r.qcCheck', 'rws.externalId as workflow')
        assert.deepEqual(lastResult, { qcCheck: 1, workflow: 'Deliverable' })

        yield server
          .get(`${devicePath}?checkpoint=rrt1723_0&offset=1`)
          .set('Authorization', device1723Auth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body.checkpoint, 'undefined')

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1723')
            assert.property(lastResult.workflow, 'changedOn')

            assert.deepEqual(
              _.omit(lastResult, 'sample', 'workflow', 'location'),
              {
                id: device1723ExternalId,
                data: {
                  resultText: '154112',
                  copies: 154112,
                },
                patient: {
                  name: 'Fran',
                  surname: 'Love',
                  age: 231,
                  gender: 'F',
                  artNumber: '2341sfkj',
                },
                assay: { id: 'HivVl' },
                category: [{ id: 'Success' }],
                type: { id: 'Patient' },
                source: { id: 'Generated' },
              }
            )
          })

        yield waitAsyncComplete()

        yield server
          .get(`${devicePath}?checkpoint=rrt1723_0&offset=6`)
          .set('Authorization', device1723Auth)
          .then(res => {
            assert.equal(res.status, 404)
          })

        yield waitAsyncComplete()

        yield server
          .get(`${devicePath}?checkpoint=rrt_0&offset=5`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.equal(res.body.checkpoint, 'rrt_2')

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1723')
            assert.property(lastResult.workflow, 'changedOn')
            assert.equal(lastResult.workflow.status.id, 'Delivered')

            assert.deepEqual(
              _.omit(lastResult, 'sample', 'workflow', 'location'),
              {
                id: device1723ExternalId,
                data: {
                  resultText: '154112',
                  copies: 154112,
                },
                patient: {
                  name: 'Fran',
                  surname: 'Love',
                  age: 231,
                  gender: 'F',
                  artNumber: '2341sfkj',
                },
                assay: { id: 'HivVl' },
                category: [{ id: 'MoreThan1000' }],
                type: { id: 'Patient' },
                source: { id: 'LIMS' },
                notes: '154,112 Copies / mL',
              }
            )
          })

        yield server
          .get(`${devicePath}?checkpoint=rrt_1&offset=4`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.equal(res.body.checkpoint, 'rrt_2')

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1723')
            assert.property(lastResult.workflow, 'changedOn')

            assert.deepEqual(
              _.omit(lastResult, 'sample', 'workflow', 'location'),
              {
                id: device1723ExternalId,
                data: {
                  resultText: '154112',
                  copies: 154112,
                },
                patient: {
                  name: 'Fran',
                  surname: 'Love',
                  age: 231,
                  gender: 'F',
                  artNumber: '2341sfkj',
                },
                assay: { id: 'HivVl' },
                category: [{ id: 'MoreThan1000' }],
                type: { id: 'Patient' },
                source: { id: 'LIMS' },
                notes: '154,112 Copies / mL',
              }
            )
          })

        yield server
          .get(`${devicePath}?checkpoint=rrt_2`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.equal(res.body.checkpoint, 'rrt_2')

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1723')
            assert.property(lastResult.workflow, 'changedOn')

            assert.deepEqual(
              _.omit(lastResult, 'sample', 'workflow', 'location'),
              {
                id: device1723ExternalId,
                data: {
                  resultText: '154112',
                  copies: 154112,
                },
                patient: {
                  name: 'Fran',
                  surname: 'Love',
                  age: 231,
                  gender: 'F',
                  artNumber: '2341sfkj',
                },
                assay: { id: 'HivVl' },
                category: [{ id: 'MoreThan1000' }],
                type: { id: 'Patient' },
                source: { id: 'LIMS' },
                notes: '154,112 Copies / mL',
              }
            )
          })

        yield server
          .get(`${devicePath}?checkpoint=rrt_2&offset=-4`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.equal(res.body.checkpoint, 'rrt_1')

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1315')
            assert.property(lastResult.workflow, 'changedOn')

            assert.deepEqual(
              _.omit(lastResult, 'sample', 'workflow', 'location'),
              {
                id: device1315ExternalId,
                data: {
                  resultText: '454112',
                  copies: 454112,
                },
                patient: {
                  name: 'Bob',
                  surname: 'Hope',
                  age: 312,
                  gender: 'M',
                  artNumber: '1341kjkj',
                },
                assay: { id: 'HivVl' },
                category: [{ id: 'MoreThan1000' }],
                type: { id: 'Patient' },
                source: { id: 'LIMS' },
                notes: '454,112 Copies / mL',
              }
            )
          })

        yield server
          .get(`${devicePath}?checkpoint=rrt1315_0&offset=1`)
          .set('Authorization', device1315Auth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body.checkpoint, 'undefined')

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1315')
            assert.property(lastResult.workflow, 'changedOn')

            assert.deepEqual(
              _.omit(lastResult, 'sample', 'workflow', 'location'),
              {
                id: device1315ExternalId,
                data: {
                  resultText: '454112',
                  copies: 454112,
                },
                patient: {
                  name: 'Bob',
                  surname: 'Hope',
                  age: 312,
                  gender: 'M',
                  artNumber: '1341kjkj',
                },
                assay: { id: 'HivVl' },
                category: [{ id: 'Success' }],
                type: { id: 'Patient' },
                source: { id: 'Generated' },
              }
            )
          })

        yield server
          .get(`${devicePath}?checkpoint=rrt1315_0&offset=6`)
          .set('Authorization', device1315Auth)
          .then(res => {
            assert.equal(res.status, 404)
          })

        yield server
          .post(devicePostResultPath)
          .set('Authorization', device1723Auth)
          .send({
            checkpoint: 'rrt1723_1',
            id: device1315ExternalId,
            workflow: { status: { id: 'Acknowledged' } },
          })
          .then(res => {
            // Device 1723 does not have access to resultIds[0]
            assert.equal(res.status, 400)
          })

        yield server
          .post(devicePostResultPath)
          .set('Authorization', device1723Auth)
          .send({
            checkpoint: 'rrt1723_2',
            id: device1723ExternalId,
            workflow: { status: { id: 'Acknowledged' } },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })

        yield waitAsyncComplete()

        yield server
          .get(devicePath)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.equal(res.body.checkpoint, 'rrt_2')

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.equal(lastResult.id, device1723ExternalId)
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1723')
            assert.equal(lastResult.workflow.status.id, 'Acknowledged')
            assert.property(lastResult.workflow, 'changedOn')

            assert.deepEqual(
              _.omit(lastResult, 'sample', 'workflow', 'location'),
              {
                id: device1723ExternalId,
                data: {
                  resultText: '154112',
                  copies: 154112,
                },
                patient: {
                  name: 'Fran',
                  surname: 'Love',
                  age: 231,
                  gender: 'F',
                  artNumber: '2341sfkj',
                },
                assay: { id: 'HivVl' },
                category: [{ id: 'MoreThan1000' }],
                type: { id: 'Patient' },
                source: { id: 'LIMS' },
                notes: '154,112 Copies / mL',
              }
            )
          })

        yield server
          .get(`${devicePath}?checkpoint=rrt1723_2`)
          .set('Authorization', device1723Auth)
          .then(res => {
            assert.equal(res.status, 200)

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.equal(lastResult.id, device1723ExternalId)
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1723')
            assert.equal(lastResult.workflow.status.id, 'Acknowledged')
            assert.property(lastResult.workflow, 'changedOn')

            assert.deepEqual(
              _.omit(lastResult, 'sample', 'workflow', 'location'),
              {
                id: device1723ExternalId,
                data: {
                  resultText: '154112',
                  copies: 154112,
                },
                patient: {
                  name: 'Fran',
                  surname: 'Love',
                  age: 231,
                  gender: 'F',
                  artNumber: '2341sfkj',
                },
                assay: { id: 'HivVl' },
                category: [{ id: 'Success' }],
                type: { id: 'Patient' },
                source: { id: 'Generated' },
              }
            )
          })

        yield server
          .get(`${devicePath}?checkpoint=rrt1723_0&offset=1`)
          .set('Authorization', device1723Auth)
          .then(res => {
            assert.equal(res.status, 200)

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.equal(lastResult.id, device1723ExternalId)
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1723')
            assert.equal(lastResult.workflow.status.id, 'Acknowledged')
            assert.property(lastResult.workflow, 'changedOn')

            assert.deepEqual(
              _.omit(lastResult, 'sample', 'workflow', 'location'),
              {
                id: device1723ExternalId,
                data: {
                  resultText: '154112',
                  copies: 154112,
                },
                patient: {
                  name: 'Fran',
                  surname: 'Love',
                  age: 231,
                  gender: 'F',
                  artNumber: '2341sfkj',
                },
                assay: { id: 'HivVl' },
                category: [{ id: 'Success' }],
                type: { id: 'Patient' },
                source: { id: 'Generated' },
              }
            )
          })

        yield server
          .get(`${devicePath}?checkpoint=rrt1315_0&offset=1`)
          .set('Authorization', device1315Auth)
          .then(res => {
            assert.equal(res.status, 200)

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.notEqual(lastResult.id, device1723ExternalId)
          })

        yield server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            checkpoint: 'rrt_3',
            data: {
              resultText: '155115',
              copies: 155115,
            },
            assay: { id: 'HivVl' },
            patient: {
              name: 'Frank',
              surname: 'Nice',
              age: 931,
              gender: 'M',
              artNumber: '320113j',
            },
            workflow: { status: { id: 'Validated' } },
            sample: {
              originSite: {
                id: '1723',
              },
            },
            notes: '155,115 Copies / mL',
          })
          .then(res => {
            assert.equal(res.status, 200)
          })

        yield waitAsyncComplete()

        yield server
          .get(`${devicePath}?checkpoint=rrt_0&offset=6`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1723')
            assert.equal(lastResult.workflow.status.id, 'Acknowledged')
            assert.property(lastResult.workflow, 'changedOn')

            assert.deepEqual(
              _.omit(lastResult, 'sample', 'workflow', 'location'),
              {
                id: device1723ExternalId,
                data: {
                  resultText: '154112',
                  copies: 154112,
                },
                patient: {
                  name: 'Fran',
                  surname: 'Love',
                  age: 231,
                  gender: 'F',
                  artNumber: '2341sfkj',
                },
                assay: { id: 'HivVl' },
                category: [{ id: 'MoreThan1000' }],
                type: { id: 'Patient' },
                source: { id: 'LIMS' },
                notes: '154,112 Copies / mL',
              }
            )
          })

        yield server
          .get(`${devicePath}?checkpoint=rrt_0&offset=12`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1723')
            assert.equal(lastResult.workflow.status.id, 'Delivered')
            assert.property(lastResult.workflow, 'changedOn')

            assert.deepEqual(
              _.omit(lastResult, 'sample', 'workflow', 'location'),
              {
                data: {
                  resultText: '155115',
                  copies: 155115,
                },
                patient: {
                  name: 'Frank',
                  surname: 'Nice',
                  age: 931,
                  gender: 'M',
                  artNumber: '320113j',
                },
                assay: { id: 'HivVl' },
                category: [{ id: 'MoreThan1000' }],
                type: { id: 'Patient' },
                source: { id: 'LIMS' },
                notes: '155,115 Copies / mL',
              }
            )
          })

        yield server
          .get(`${devicePath}?checkpoint=rrt_1&offset=5`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1723')
            assert.equal(lastResult.workflow.status.id, 'Acknowledged')
            assert.property(lastResult.workflow, 'changedOn')

            assert.deepEqual(
              _.omit(lastResult, 'sample', 'workflow', 'location'),
              {
                id: device1723ExternalId,
                data: {
                  resultText: '154112',
                  copies: 154112,
                },
                patient: {
                  name: 'Fran',
                  surname: 'Love',
                  age: 231,
                  gender: 'F',
                  artNumber: '2341sfkj',
                },
                assay: { id: 'HivVl' },
                category: [{ id: 'MoreThan1000' }],
                type: { id: 'Patient' },
                source: { id: 'LIMS' },
                notes: '154,112 Copies / mL',
              }
            )
          })

        yield server
          .get(`${devicePath}?checkpoint=rrt_2`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1723')
            assert.equal(lastResult.workflow.status.id, 'Acknowledged')
            assert.property(lastResult.workflow, 'changedOn')

            assert.deepEqual(
              _.omit(lastResult, 'sample', 'workflow', 'location'),
              {
                id: device1723ExternalId,
                data: {
                  resultText: '154112',
                  copies: 154112,
                },
                patient: {
                  name: 'Fran',
                  surname: 'Love',
                  age: 231,
                  gender: 'F',
                  artNumber: '2341sfkj',
                },
                assay: { id: 'HivVl' },
                category: [{ id: 'MoreThan1000' }],
                type: { id: 'Patient' },
                source: { id: 'LIMS' },
                notes: '154,112 Copies / mL',
              }
            )
          })

        yield server
          .get(`${devicePath}?checkpoint=rrt_2&offset=-1`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1315')
            assert.property(lastResult.workflow, 'changedOn')

            assert.deepEqual(
              _.omit(lastResult, 'sample', 'workflow', 'location'),
              {
                id: device1315ExternalId,
                data: {
                  resultText: '454112',
                  copies: 454112,
                },
                patient: {
                  name: 'Bob',
                  surname: 'Hope',
                  age: 312,
                  gender: 'M',
                  artNumber: '1341kjkj',
                },
                assay: { id: 'HivVl' },
                category: [{ id: 'MoreThan1000' }],
                type: { id: 'Patient' },
                source: { id: 'LIMS' },
                notes: '454,112 Copies / mL',
              }
            )
          })

        yield server
          .get(`${devicePath}?checkpoint=rrt_3&offset=-7`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
            assert.property(lastResult.sample.originSite, 'id')
            assert.equal(lastResult.sample.originSite.id, '1315')
            assert.property(lastResult.workflow, 'changedOn')

            assert.deepEqual(
              _.omit(lastResult, 'sample', 'workflow', 'location'),
              {
                id: device1315ExternalId,
                data: {
                  resultText: '454112',
                  copies: 454112,
                },
                patient: {
                  name: 'Bob',
                  surname: 'Hope',
                  age: 312,
                  gender: 'M',
                  artNumber: '1341kjkj',
                },
                assay: { id: 'HivVl' },
                category: [{ id: 'MoreThan1000' }],
                type: { id: 'Patient' },
                source: { id: 'LIMS' },
                notes: '454,112 Copies / mL',
              }
            )
          })

        yield waitAsyncComplete()
      }))

    it('should set the status of a result to delivered when it is sent to a terminal', () =>
      runTest(function*(knex) {
        const { apiKey, deviceAuth } = context

        const externalId = `1315-${new Date()}`

        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            checkpoint: 'rrt_0',
            type: { id: 'CHAILIMS' },
            site: { id: 'CHIZ' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })

        const deviceLab = yield* getDeviceFromApiKey(knex, apiKey)

        yield server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            id: externalId,
            checkpoint: 'rrt_1',
            data: {
              resultText: '454112',
              copies: 454112,
            },
            sample: {
              originSite: {
                id: '1315',
              },
            },
            assay: { id: 'HivVl' },
            notes: '454,112 Copies / mL',
          })
          .then(res => {
            assert.equal(res.status, 200)
          })

        const lastResultId = yield* getLastResultId(knex, deviceLab.id)
        yield setResultAsDeliverableAndApprove(context, lastResultId)

        yield server
          .get(`${devicePath}?checkpoint=rrt_1`)
          .set('Authorization', deviceAuth)
          .then(res => {
            assert.equal(res.status, 200)
            assert.equal(res.body.checkpoint, 'rrt_1')

            const lastResult = res.body.result
            assert.typeOf(lastResult, 'Object')
          })

        const result = yield knex('Result as r')
          .where({ externalId })
          .first()
        assert.deepEqual(JSON.parse(result.resultData), {
          resultText: '454112',
          copies: 454112,
        })
        assert.isNotOk(result.errorCode)

        const resultWorkflowStatus = yield knex('ResultWorkflowStatus as rs')
          .where({ id: result.resultWorkflowStatusId })
          .first('externalId')
        assert.equal(resultWorkflowStatus.externalId, 'Delivered')
      }))

    describe('when auto acknowledge rules are setup for partner', () => {
      describe('and a large number of historical results are being downloaded', () => {
        it('should automatically acknowledge results based on where they are down the list and date ended on', () =>
          runTest(function*(knex) {
            const {
              deviceAuth,
              apiKey,
              auth: { partner: partnerName },
            } = context

            // Make sure the device is found on aspect
            yield server
              .post(devicePath)
              .set('Authorization', deviceAuth)
              .send({
                checkpoint: 'rrt_0',
                type: { id: 'CHAILIMS' },
                site: { id: 'PIH' },
              })
              .then(res => {
                assert.equal(res.status, 200)
              })

            const deviceLab = yield* getDeviceFromApiKey(knex, apiKey)

            const partner = yield knex('Partner as p')
              .where({ name: partnerName })
              .first()

            // Ensure the partner we are dealing with has
            // valid auto-acknowledge settings
            assert.isAbove(
              partner.deviceLogHistoryDays,
              partner.autoAcknowledgeOlderThanDays
            )
            assert.isOk(partner.autoAcknowledgeOlderThanDays)
            assert.isOk(partner.numberToLeaveUnacknowledged)
            assert.equal(partner.plugin, 'malawi')

            // We need to upload tests that ended a while ago
            const testEndedOn = subDays(
              new Date(),
              partner.autoAcknowledgeOlderThanDays + 1
            )
            const numberOfTestsToRun = partner.numberToLeaveUnacknowledged + 10
            const externalIdStart = `1515-${format(testEndedOn, 'YYYYMMDD')}`

            for (let i = 0; i < numberOfTestsToRun; i++) {
              // Increment the checkpoint and
              // upload a historical test which
              // has been validated
              yield server
                .post(devicePostResultPath)
                .set('Authorization', deviceAuth)
                .send({
                  id: `${externalIdStart}-${i}`,
                  checkpoint: `rrt_${i + 1}`,
                  data: {
                    resultText: '454112',
                    endedOn: subMinutes(testEndedOn, i),
                    copies: 454112,
                  },
                  sample: {
                    originSite: {
                      id: '1315',
                    },
                  },
                  endedOn: subMinutes(testEndedOn, i),
                  assay: { id: 'HivVl' },
                  notes: '454,112 Copies / mL',
                })
                .then(res => {
                  assert.equal(res.status, 200)
                })

              const lastResultId = yield* getLastResultId(knex, deviceLab.id)
              yield setResultAsDeliverableAndApprove(context, lastResultId)
            }

            // Start a sync operation with a new check point
            const device1315Key = yield* context.createApiKey(knex)
            context.apiKeysWithoutDevice.push(device1315Key)
            const device1315Auth = `Bearer ${device1315Key.token}`
            const latestCheckpoint = `rrt_${numberOfTestsToRun + 1}`
            yield server
              .post(devicePath)
              .set('Authorization', device1315Auth)
              .send({
                checkpoint: latestCheckpoint,
                type: { id: 'AspectReporter' },
                site: { id: '1315' },
              })
              .then(res => {
                assert.equal(res.status, 200)
              })

            yield waitAsyncComplete()

            let offset = 0
            let historicalSyncComplete = false
            while (!historicalSyncComplete) {
              offset += 1
              historicalSyncComplete = yield server
                .get(
                  `${devicePostResultPath}?checkpoint=${latestCheckpoint}&offset=${offset}`
                )
                .set('Authorization', device1315Auth)
                .then(res => {
                  if (res.status === 404) {
                    return true
                  }
                  assert.equal(res.status, 200)

                  const lastResult = res.body.result
                  assert.typeOf(lastResult, 'Object')
                  return false
                })
            }

            // Verify that results have been auto acknowledged correctly
            for (let i = 0; i < numberOfTestsToRun; i++) {
              const resultWorkflowStatus = yield knex('Result as r')
                .innerJoin(
                  'ResultWorkflowStatus as rs',
                  'r.resultWorkflowStatusId',
                  'rs.id'
                )
                .where({ 'r.externalId': `${externalIdStart}-${i}` })
                .first('rs.externalId')

              if (i < partner.numberToLeaveUnacknowledged) {
                assert.equal(resultWorkflowStatus.externalId, 'Delivered')
              } else {
                assert.equal(resultWorkflowStatus.externalId, 'Acknowledged')
              }
            }
          }))
      })

      describe('and a small number of historical results are being downloaded', () => {
        it('should NOT automatically acknowledge results so that there are always results visible on the terminal after initial sync', () =>
          runTest(function*(knex) {
            const {
              deviceAuth,
              apiKey,
              auth: { partner: partnerName },
            } = context

            // Make sure the device is found on aspect
            yield server
              .post(devicePath)
              .set('Authorization', deviceAuth)
              .send({
                checkpoint: 'rrt_0',
                type: { id: 'CHAILIMS' },
                site: { id: 'PIH' },
              })
              .then(res => {
                assert.equal(res.status, 200)
              })

            const deviceLab = yield* getDeviceFromApiKey(knex, apiKey)

            const partner = yield knex('Partner as p')
              .where({ name: partnerName })
              .first()

            // Ensure the partner we are dealing with has
            // valid auto-acknowledge settings
            assert.isAbove(
              partner.deviceLogHistoryDays,
              partner.autoAcknowledgeOlderThanDays
            )
            assert.isOk(partner.autoAcknowledgeOlderThanDays)
            // Ensure that we will always leave a few result unacknowledged
            assert.isAbove(partner.numberToLeaveUnacknowledged, 1)

            // We need to upload tests that ended a while ago
            const testEndedOn = subDays(
              new Date(),
              partner.autoAcknowledgeOlderThanDays + 1
            )
            // Only upload enough results so that they all remain unacknowledged
            const numberOfTestsToRun = partner.numberToLeaveUnacknowledged - 1
            const externalIdStart = `1615-${format(testEndedOn, 'YYYYMMDD')}`

            for (let i = 0; i < numberOfTestsToRun; i++) {
              // Increment the checkpoint and
              // upload a historical test which
              // has been validated
              yield server
                .post(devicePostResultPath)
                .set('Authorization', deviceAuth)
                .send({
                  id: `${externalIdStart}-${i}`,
                  checkpoint: `rrt_${i + 1}`,
                  data: {
                    resultText: '454112',
                    endedOn: subMinutes(testEndedOn, i),
                    copies: 454112,
                  },
                  sample: {
                    originSite: {
                      id: '1315',
                    },
                  },
                  endedOn: subMinutes(testEndedOn, i),
                  assay: { id: 'HivVl' },
                  notes: '454,112 Copies / mL',
                })
                .then(res => {
                  assert.equal(res.status, 200)
                })

              const lastResultId = yield* getLastResultId(knex, deviceLab.id)
              yield setResultAsDeliverableAndApprove(context, lastResultId)
            }

            // Start a sync operation with a new check point
            const device1315Key = yield* context.createApiKey(knex)
            context.apiKeysWithoutDevice.push(device1315Key)
            const device1315Auth = `Bearer ${device1315Key.token}`
            const latestCheckpoint = `rrt_${numberOfTestsToRun + 1}`
            yield server
              .post(devicePath)
              .set('Authorization', device1315Auth)
              .send({
                checkpoint: latestCheckpoint,
                type: { id: 'RRT' },
                site: { id: '1315' },
              })
              .then(res => {
                assert.equal(res.status, 200)
              })

            yield waitAsyncComplete()

            let offset = 0
            let historicalSyncComplete = false
            while (!historicalSyncComplete) {
              offset += 1
              historicalSyncComplete = yield server
                .get(
                  `${devicePostResultPath}?checkpoint=${latestCheckpoint}&offset=${offset}`
                )
                .set('Authorization', device1315Auth)
                .then(res => {
                  if (res.status === 404) {
                    return true
                  }
                  assert.equal(res.status, 200)

                  const lastResult = res.body.result
                  assert.typeOf(lastResult, 'Object')
                  return false
                })
            }

            for (let i = 0; i < numberOfTestsToRun; i++) {
              // Download a historical result from the
              // checkpoint created when we started the
              // sync operation
              const offset = i + 1
              yield server
                .get(
                  `${devicePostResultPath}?checkpoint=rrt_0&offset=${offset}`
                )
                .set('Authorization', deviceAuth)
                .then(res => {
                  assert.equal(res.status, 200)

                  const lastResult = res.body.result
                  assert.typeOf(lastResult, 'Object')
                })
            }

            // Verify that results have been not been auto acknowledged
            for (let i = 0; i < numberOfTestsToRun; i++) {
              const resultWorkflowStatus = yield knex('Result as r')
                .innerJoin(
                  'ResultWorkflowStatus as rs',
                  'r.resultWorkflowStatusId',
                  'rs.id'
                )
                .where({ 'r.externalId': `${externalIdStart}-${i}` })
                .first('rs.externalId')

              assert.equal(resultWorkflowStatus.externalId, 'Delivered')
            }
          }))
      })

      describe('and the results being downloaded are current', () => {
        it('should NOT automatically acknowledge results so that there are always results visible on the terminal after initial sync', () =>
          runTest(function*(knex) {
            const {
              deviceAuth,
              apiKey,
              auth: { partner: partnerName },
            } = context

            // Make sure the device is found on aspect
            yield server
              .post(devicePath)
              .set('Authorization', deviceAuth)
              .send({
                checkpoint: 'rrt_0',
                type: { id: 'CHAILIMS' },
                site: { id: 'PIH' },
              })
              .then(res => {
                assert.equal(res.status, 200)
              })

            const deviceLab = yield* getDeviceFromApiKey(knex, apiKey)

            const partner = yield knex('Partner as p')
              .where({ name: partnerName })
              .first()

            // Ensure the partner we are dealing with has
            // valid auto-acknowledge settings
            assert.isAbove(
              partner.deviceLogHistoryDays,
              partner.autoAcknowledgeOlderThanDays
            )
            assert.isOk(partner.autoAcknowledgeOlderThanDays)
            assert.isOk(partner.numberToLeaveUnacknowledged)
            assert.equal(partner.plugin, 'malawi')

            // We need to upload tests that ended recently (not historical results)
            const testEndedOn = subDays(
              new Date(),
              partner.autoAcknowledgeOlderThanDays - 1
            )
            // Upload lots of new results
            const numberOfTestsToRun = partner.numberToLeaveUnacknowledged * 2
            const externalIdStart = `1715-${format(testEndedOn, 'YYYYMMDD')}`

            for (let i = 0; i < numberOfTestsToRun; i++) {
              // Increment the checkpoint and
              // upload a historical test which
              // has been validated
              yield server
                .post(devicePostResultPath)
                .set('Authorization', deviceAuth)
                .send({
                  id: `${externalIdStart}-${i}`,
                  checkpoint: `rrt_${i + 1}`,
                  data: {
                    resultText: '454112',
                    endedOn: subMinutes(testEndedOn, i),
                    copies: 454112,
                  },
                  sample: {
                    originSite: {
                      id: '1315',
                    },
                  },
                  endedOn: subMinutes(testEndedOn, i),
                  assay: { id: 'HivVl' },
                  notes: '454,112 Copies / mL',
                })
                .then(res => {
                  assert.equal(res.status, 200)
                })

              const lastResultId = yield* getLastResultId(knex, deviceLab.id)
              yield setResultAsDeliverableAndApprove(context, lastResultId)
            }

            // Start a sync operation with a new check point
            const device1315Key = yield* context.createApiKey(knex)
            context.apiKeysWithoutDevice.push(device1315Key)
            const device1315Auth = `Bearer ${device1315Key.token}`
            const latestCheckpoint = `rrt_${numberOfTestsToRun + 1}`
            yield server
              .post(devicePath)
              .set('Authorization', device1315Auth)
              .send({
                checkpoint: latestCheckpoint,
                type: { id: 'AspectReporter' },
                site: { id: '1315' },
              })
              .then(res => {
                assert.equal(res.status, 200)
              })

            yield waitAsyncComplete()

            let offset = 0
            let historicalSyncComplete = false
            while (!historicalSyncComplete) {
              offset += 1
              historicalSyncComplete = yield server
                .get(
                  `${devicePostResultPath}?checkpoint=${latestCheckpoint}&offset=${offset}`
                )
                .set('Authorization', device1315Auth)
                .then(res => {
                  if (res.status === 404) {
                    return true
                  }
                  assert.equal(res.status, 200)

                  const lastResult = res.body.result
                  assert.typeOf(lastResult, 'Object')
                  return false
                })
            }

            // Verify that results have been not been auto acknowledged
            for (let i = 0; i < numberOfTestsToRun; i++) {
              const resultWorkflowStatus = yield knex('Result as r')
                .innerJoin(
                  'ResultWorkflowStatus as rs',
                  'r.resultWorkflowStatusId',
                  'rs.id'
                )
                .where({ 'r.externalId': `${externalIdStart}-${i}` })
                .first('rs.externalId')

              assert.equal(resultWorkflowStatus.externalId, 'Delivered')
            }
          }))
      })
    })

    it('should change site', () =>
      runTest(function*(knex) {
        const { apiKey, deviceAuth } = context
        assert.isOk(apiKey)

        let device = yield* getDeviceFromApiKey(knex, apiKey)
        assert.isNotOk(device)

        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            name: 'Device 123',
            type: { id: 'CHAILIMS' },
            site: { id: 'CHIZ' },
            checkpoint: 'ck1',
            result: {
              data: { a: 'b' },
              assay: { id: 'HivVl' },
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        device = yield* getDeviceFromApiKey(knex, apiKey)
        assert.isOk(device)
        assert.isOk(device.id)

        device = yield knex('Site as s')
          .innerJoin('Device as d', 'd.siteId', 's.id')
          .innerJoin('DeviceStatus as ds', 'ds.id', 'd.deviceStatusId')
          .where('d.id', device.id)
          .first('d.id', 's.externalId as site', 'ds.token as status')
        assert.equal(device.site, 'CHIZ')
        assert.equal(device.status, 'approved')

        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            name: 'Device 123',
            type: { id: 'CHAILIMS' },
            site: { id: 'BALAKA' },
            checkpoint: 'ck1',
            result: {
              data: { a: 'b' },
              assay: { id: 'HivVl' },
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        device = yield knex('Site as s')
          .innerJoin('Device as d', 'd.siteId', 's.id')
          .innerJoin('DeviceStatus as ds', 'ds.id', 'd.deviceStatusId')
          .where('d.id', device.id)
          .first('d.id', 's.externalId as site', 'ds.token as status')
        assert.equal(device.site, 'BALAKA')
        assert.equal(device.status, 'assigned')

        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            name: 'Device 123',
            type: { id: 'CHAILIMS' },
            site: { id: 'CHIZ' },
            checkpoint: 'ck1',
            result: {
              data: { a: 'b' },
              assay: { id: 'HivVl' },
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        device = yield knex('Site as s')
          .innerJoin('Device as d', 'd.siteId', 's.id')
          .innerJoin('DeviceStatus as ds', 'ds.id', 'd.deviceStatusId')
          .where('d.id', device.id)
          .first('d.id', 's.externalId as site', 'ds.token as status')
        assert.equal(device.site, 'CHIZ')
        assert.equal(device.status, 'assigned')
      }))

    it('should set the resultCategory of a result', () =>
      runTest(function*(knex) {
        const { apiKey, deviceAuth } = context
        assert.isOk(apiKey)

        const device = yield* getDeviceFromApiKey(knex, apiKey)
        assert.isNotOk(device)

        // HivVl Missing
        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            name: 'Device 0123',
            type: { id: 'CHAILIMS' },
            site: { id: 'CHIZ' },
            checkpoint: 'ck1',
            result: {
              data: {
                a: 'k',
                resultText: 'Missing',
              },
              assay: { id: 'HivVl' },
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        const malawiDevice1 = yield* getDeviceFromApiKey(knex, apiKey)
        const malawiResult1Id = yield* getLastResultId(knex, malawiDevice1.id)

        const malawiResult1 = yield knex('Result as r')
          .where({ id: malawiResult1Id })
          .first()

        assert.deepEqual(JSON.parse(malawiResult1.resultData), {
          a: 'k',
          resultText: 'Missing',
        })

        const malawiResult1Category = (yield knex('ResultCategory as rc')
          .where({ 'rc.id': malawiResult1.resultCategory1 })
          .first('rc.externalId')).externalId

        assert.equal(malawiResult1Category, 'Missing')

        // HivVl < LDL
        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            name: 'Device 0124',
            type: { id: 'CHAILIMS' },
            site: { id: 'CHIZ' },
            checkpoint: 'ck1',
            result: {
              data: {
                a: 'g',
                resultText: '< LDL',
                copies: 102,
              },
              assay: { id: 'HivVl' },
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        const malawiDevice2 = yield* getDeviceFromApiKey(knex, apiKey)
        const malawiResultId2 = yield* getLastResultId(knex, malawiDevice2.id)

        const malawiResult2 = yield knex('Result as r')
          .where({ id: malawiResultId2 })
          .first()

        assert.deepEqual(JSON.parse(malawiResult2.resultData), {
          a: 'g',
          resultText: '< LDL',
          copies: 102,
        })

        const malawiResult2Category = (yield knex('ResultCategory as rc')
          .where({ 'rc.id': malawiResult2.resultCategory1 })
          .first('rc.externalId')).externalId

        assert.equal(malawiResult2Category, 'LessThan1000')

        // HivVl MoreThan1000
        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            name: 'Device 0125',
            type: { id: 'CHAILIMS' },
            site: { id: 'CHIZ' },
            checkpoint: 'ck1',
            result: {
              data: {
                a: 'g',
                resultText: 'RandomText',
                copies: 102193,
              },
              assay: { id: 'HivVl' },
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        const malawiDevice3 = yield* getDeviceFromApiKey(knex, apiKey)
        const malawiResultId3 = yield* getLastResultId(knex, malawiDevice3.id)

        const malawiResult3 = yield knex('Result as r')
          .where({ id: malawiResultId3 })
          .first()

        assert.deepEqual(JSON.parse(malawiResult3.resultData), {
          a: 'g',
          resultText: 'RandomText',
          copies: 102193,
        })

        const malawiResult3Category = (yield knex('ResultCategory as rc')
          .where({ 'rc.id': malawiResult3.resultCategory1 })
          .first('rc.externalId')).externalId

        assert.equal(malawiResult3Category, 'MoreThan1000')

        // EID Negative/Not Detected
        yield server
          .post(devicePath)
          .set('Authorization', deviceAuth)
          .send({
            name: 'Device 0126',
            type: { id: 'CHAILIMS' },
            site: { id: 'CHIZ' },
            checkpoint: 'ck1',
            result: {
              data: {
                a: 'h',
                resultText: 'Negative',
              },
              assay: { id: 'EID' },
            },
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        const malawiDevice4 = yield* getDeviceFromApiKey(knex, apiKey)
        const malawiResultId4 = yield* getLastResultId(knex, malawiDevice4.id)

        const malawiResult4 = yield knex('Result as r')
          .where({ id: malawiResultId4 })
          .first()

        assert.deepEqual(JSON.parse(malawiResult4.resultData), {
          a: 'h',
          resultText: 'Negative',
        })

        const malawiResult4Category = (yield knex('ResultCategory as rc')
          .where({ 'rc.id': malawiResult4.resultCategory1 })
          .first('rc.externalId')).externalId

        assert.equal(malawiResult4Category, 'NotDetected')

        yield server
          .post(devicePostResultPath)
          .set('Authorization', deviceAuth)
          .send({
            checkpoint: 'ck012',
            data: { a: 'f', resultText: 'Rejected' },
            assay: { id: 'HivVl' },
          })
          .then(res => {
            assert.equal(res.status, 200)
          })
      }))
  })
})
