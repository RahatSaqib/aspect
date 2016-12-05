const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const shared = require('../utils/sharedToken')
const sharedDevice = require('./deviceToken')

const { run } = require('../../src/db')

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const assert = chai.assert

const now = new Date()

describe('Device Result API routes', () => {
  describe('admin GeneXpert result', () => {
    const resultIds = []

    const clientBasePath = '/api/result'
    shared.checkToken(server, clientBasePath)
    sharedDevice.authenticateUserAndFirstDevice(server, { user: 'admin', type: 'GeneXpert' })

    const devicePath = '/device'
    const devicePostResultPath = '/device/result'
    const deviceGetResultPath = devicePostResultPath

    afterEach(() => run(function* (knex) {
      // cleanup
      if (resultIds.length > 0) {
        const deviceLogIds = yield knex('DeviceLogUpdate as dlu')
          .innerJoin('Result as r', 'dlu.resultId', 'r.id')
          .whereIn('r.externalId', resultIds)
          .select('dlu.deviceLogId')
          .map(dlu => dlu.deviceLogId)

        yield knex('AuditLog').whereIn('deviceLogId', deviceLogIds).delete()
        yield knex('DeviceLogUpdate').whereIn('deviceLogId', deviceLogIds).delete()
        yield knex('DeviceLog').whereIn('id', deviceLogIds).delete()
        yield knex('Result').whereIn('externalId', resultIds).delete()

        resultIds.splice(0)
      }
    }))

    it('should add and return device results', () => run(function* (knex) {
      const { deviceId } = sharedDevice
      const clientSingleResultPath = `${clientBasePath}/`
      const clientPath = `${clientBasePath}?deviceId=${deviceId}`
      const clientAuth = `Bearer ${shared.token}`
      const deviceAuth = `Bearer ${sharedDevice.deviceToken}`

      let initialDataLength = 0
      const [{ count: initialLogLength }] = yield knex('DeviceLogUpdate').count('id as count')

      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 0)
          initialDataLength = res.body.data.length
          assert.property(res.body, 'total')
        })

      yield server.post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ checkpoint: 'ck1', result: { data: { a: 'b' }, assay: { id: 'HivVl' } } })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.typeOf(res.body.result, 'Object')
          assert.property(res.body.result, 'id')
          resultIds.push(res.body.result.id)
        })

      const [{ count: logLength1 }] = yield knex('DeviceLogUpdate').count('id as count')
      assert.equal(logLength1, initialLogLength + 1)

      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.property(res.body, 'total')

          assert.equal(res.body.data.length, initialDataLength + 1)
          const lastResult = _.find(res.body.data, { externalId: resultIds[0] })
          assert.typeOf(lastResult, 'Object')
          assert.equal(lastResult.externalId, resultIds[0])
        })

      const result1 = yield knex('Result as r')
        .where({ externalId: resultIds[0] }).first()
      assert.equal(result1.externalId, resultIds[0])
      assert.deepEqual(JSON.parse(result1.resultData), { a: 'b' })

      const result1Type = yield knex('ResultType as rt')
        .where({ id: result1.resultTypeId }).first('externalId')
      assert.equal(result1Type.externalId, 'Patient')

      const result1Status = yield knex('ResultWorkflowStatus as rs')
        .where({ id: result1.resultWorkflowStatusId }).first('externalId')
      assert.equal(result1Status.externalId, 'OK')

      const result1Sample = yield knex('Sample as s')
        .where({ id: result1.sampleId }).first()
      assert.equal(result1.siteId, result1Sample.originSiteId)

      const result1SampleSite = yield knex('Site as s')
        .where({ id: result1Sample.originSiteId }).first()
      assert.equal(result1.siteId, result1Sample.originSiteId)

      const result1Assay = yield knex('Assay as assay')
        .where({ id: result1.assayId }).first('externalId', 'name')
      assert.equal(result1Assay.externalId, 'HivVl')
      assert.equal(result1Assay.name, 'GeneXpert HIV VL')

      const [result1Category1, result1Category2] = yield knex('ResultCategory as rt')
        .whereIn('id', [result1.resultCategory1, result1.resultCategory2]).select('externalId')
      assert.equal(result1Category1.externalId, 'Success')
      assert.isNotOk(result1Category2)

      const [{ rawMessage: log1Raw, resultId: resultId1 }] = yield knex('DeviceLog as dl')
        .innerJoin('DeviceLogUpdate as dlu', 'dl.id', 'dlu.deviceLogId')
        .innerJoin('Result as r', 'r.id', 'dlu.resultId')
        .where({ externalId: resultIds[0] })
        .select('rawMessage', 'resultId')
      assert.deepEqual(JSON.parse(log1Raw), {
        checkpoint: 'ck1', result: { data: { a: 'b' }, assay: { id: 'HivVl' } } })

      yield server.get(clientSingleResultPath + resultId1)
        .set('Authorization', clientAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.typeOf(res.body.data, 'Object')
          assert.typeOf(res.body.data.resultData, 'Object')
          assert.deepEqual(res.body.data.resultData, { a: 'b' })
        })

      const { checkpoint: checkpoint1 } = yield knex('DeviceLog')
        .where({ deviceId }).orderBy('id', 'desc').first('checkpoint')
      assert.equal(checkpoint1, 'ck1')

      yield server.get(`${deviceGetResultPath}?checkpoint=ck1`)
        .set('Authorization', deviceAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'array')
          assert.equal(res.body.length, 1)

          const lastResult = _.find(res.body, { id: resultIds[0] })
          assert.typeOf(lastResult, 'Object')
          assert.property(lastResult, 'endedOn')
          assert.property(lastResult.sample, 'id')
          assert.property(lastResult.sample.originSite, 'id')
          assert.equal(lastResult.sample.originSite.id, result1SampleSite.externalId)

          assert.deepEqual(_.omit(lastResult, 'endedOn', 'sample'), {
            id: resultIds[0],
            data: { a: 'b' },
            assay: { id: 'HivVl' },
            category: [{ id: 'Success' }],
            type: { id: 'Patient' },
            workflow: { status: { id: 'OK' } }
          })
        })


      const result2SampleSite = yield knex('Site as s')
        .where('partnerId', result1SampleSite.partnerId)
        .where('id', '<>', result1.siteId)
        .first()

      yield server.post(devicePostResultPath)
        .set('Authorization', deviceAuth)
        .send({
          checkpoint: 'ck2',
          data: { a: 'b', c: 2, d: false, e: { f: 'g' } },
          type: { id: 'Study' },
          workflow: { status: { id: 'Acknowledged' } },
          category: [
            { id: 'Detected' },
            { id: 'Indeterminate' }
          ],
          assay: {
            id: 'MtbRif',
            version: '1a.c1'
          },
          sample: {
            id: `Sample${now}`,
            originSite: {
              id: result2SampleSite.externalId
            }
          },
          location: {
            longitude: -87.581222,
            latitude: 30.419348
          },
          startedOn: '2013-12-01',
          endedOn: '2013-12-01T01:30',
          consumable: {
            serial: '132-44-222',
            expirationDate: '2014-03-01',
            lot: '331-1'
          },
          instrument: {
            serial: '444-3'
          },
          module: {
            name: 'ModA',
            serial: '555-8'
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
            phone: '856-7909'
          },
          sender: {
            version: '99-1',
            operator: 'Bob O'
          },
          notes: 'My Awesome notes about this Awesome result!',
          error: {
            code: '123',
            notes: 'Oh NOZE!'
          }
        })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'id')
          resultIds.push(res.body.id)
        })

      const { checkpoint: checkpoint2 } = yield knex('DeviceLog')
        .where({ deviceId }).orderBy('id', 'desc').first('checkpoint')
      assert.equal(checkpoint2, 'ck2')
      const [{ count: logLength2 }] = yield knex('DeviceLogUpdate').count('id as count')
      assert.equal(logLength2, initialLogLength + 2)

      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.property(res.body, 'total')

          assert.equal(res.body.data.length, initialDataLength + 2)

          const prevResult = _.find(res.body.data, { externalId: resultIds[0] })
          assert.typeOf(prevResult, 'Object')
          assert.equal(prevResult.externalId, resultIds[0])

          const lastResult = _.find(res.body.data, { externalId: resultIds[1] })
          assert.typeOf(lastResult, 'Object')
          assert.equal(lastResult.externalId, resultIds[1])
        })

      const result2 = yield knex('Result as r')
        .where({ externalId: resultIds[1] }).first()
      assert.equal(result2.externalId, resultIds[1])
      assert.deepEqual(JSON.parse(result2.resultData), { a: 'b', c: 2, d: false, e: { f: 'g' } })
      assert.equal(result2.assayVersion, '1a.c1')
      assert.approximately(result2.latitude, 30.419348, 0.000001)
      assert.approximately(result2.longitude, -87.581222, 0.000001)
      assert.deepEqual(result2.startedOn, new Date('2013-12-01'))
      assert.deepEqual(result2.endedOn, new Date('2013-12-01T01:30'))
      assert.equal(result2.consumableSerial, '132-44-222')
      assert.deepEqual(result2.consumableExpirationDate, new Date('2014-03-01'))
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
        phone: '856-7909'
      })
      assert.equal(result2.senderVersion, '99-1')
      assert.equal(result2.senderOperator, 'Bob O')
      assert.equal(result2.notes, 'My Awesome notes about this Awesome result!')
      assert.equal(result2.errorCode, '123')
      assert.equal(result2.errorNotes, 'Oh NOZE!')

      const result2Type = yield knex('ResultType as rt')
        .where({ id: result2.resultTypeId }).first('externalId')
      assert.equal(result2Type.externalId, 'Study')

      const result2Status = yield knex('ResultWorkflowStatus as rs')
        .where({ id: result2.resultWorkflowStatusId }).first('externalId')
      assert.equal(result2Status.externalId, 'Acknowledged')

      const result2Assay = yield knex('Assay as assay')
        .where({ id: result2.assayId }).first('externalId', 'name')
      assert.equal(result2Assay.externalId, 'MtbRif')
      assert.equal(result2Assay.name, 'GeneXpert MTB/Rif')

      const result2Sample = yield knex('Sample as s')
        .where({ id: result2.sampleId }).first()
      assert.notEqual(result2.siteId, result2Sample.originSiteId)
      assert.equal(result2SampleSite.id, result2Sample.originSiteId)
      assert.equal(result2Sample.externalId, `Sample${now}`)

      const [result2Category1, result2Category2] = yield knex('ResultCategory as rt')
        .whereIn('id', [result2.resultCategory1, result2.resultCategory2]).select('externalId')
      assert.equal(result2Category1.externalId, 'Detected')
      assert.equal(result2Category2.externalId, 'Indeterminate')

      const [{ rawMessage: log2Raw, resultId: resultId2 }] = yield knex('DeviceLog as dl')
        .innerJoin('DeviceLogUpdate as dlu', 'dlu.deviceLogId', 'dl.id')
        .innerJoin('Result as r', 'r.id', 'dlu.resultId')
        .where({ externalId: resultIds[1] }).select('rawMessage', 'resultId')
      assert.deepEqual(JSON.parse(log2Raw), {
        checkpoint: 'ck2',
        data: { a: 'b', c: 2, d: false, e: { f: 'g' } },
        type: { id: 'Study' },
        workflow: { status: { id: 'Acknowledged' } },
        category: [
          { id: 'Detected' },
          { id: 'Indeterminate' }
        ],
        assay: {
          id: 'MtbRif',
          version: '1a.c1'
        },
        sample: {
          id: `Sample${now}`,
          originSite: {
            id: result2SampleSite.externalId
          }
        },
        location: {
          longitude: -87.581222,
          latitude: 30.419348
        },
        startedOn: '2013-12-01',
        endedOn: '2013-12-01T01:30',
        consumable: {
          serial: '132-44-222',
          expirationDate: '2014-03-01',
          lot: '331-1'
        },
        instrument: {
          serial: '444-3'
        },
        module: {
          name: 'ModA',
          serial: '555-8'
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
          phone: '856-7909'
        },
        sender: {
          version: '99-1',
          operator: 'Bob O'
        },
        notes: 'My Awesome notes about this Awesome result!',
        error: {
          code: '123',
          notes: 'Oh NOZE!'
        }
      })

      yield server.get(clientSingleResultPath + resultId2)
        .set('Authorization', clientAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.typeOf(res.body.data, 'Object')
          assert.typeOf(res.body.data.resultData, 'Object')
          assert.deepEqual(res.body.data.resultData, { a: 'b', c: 2, d: false, e: { f: 'g' } })
        })

      yield server.get(`${deviceGetResultPath}?checkpoint=ck1`)
        .set('Authorization', deviceAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'array')
          assert.equal(res.body.length, 2)
        })

      yield server.get(`${deviceGetResultPath}?checkpoint=ck2`)
        .set('Authorization', deviceAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'array')
          assert.equal(res.body.length, 1)

          const lastResult = _.find(res.body, { id: resultIds[1] })
          assert.typeOf(lastResult, 'Object')
          assert.property(lastResult, 'endedOn')
          assert.property(lastResult.sample, 'id')
          assert.property(lastResult.sample.originSite, 'id')
          assert.equal(lastResult.sample.originSite.id, result2SampleSite.externalId)
          assert.property(lastResult, 'location')
          assert.approximately(lastResult.location.latitude, 30.419348, 0.000001)
          assert.approximately(lastResult.location.longitude, -87.581222, 0.000001)

          assert.deepEqual(_.omit(lastResult, 'location'), {
            id: resultIds[1],
            data: { a: 'b', c: 2, d: false, e: { f: 'g' } },
            assay: {
              id: 'MtbRif',
              version: '1a.c1'
            },
            type: { id: 'Study' },
            workflow: { status: { id: 'Acknowledged' } },
            category: [
              { id: 'Detected' },
              { id: 'Indeterminate' }
            ],
            sample: {
              id: `Sample${now}`,
              originSite: {
                id: result2SampleSite.externalId
              }
            },
            startedOn: '2013-12-01T00:00:00.000Z',
            endedOn: '2013-12-01T01:30:00.000Z',
            consumable: [{
              serial: '132-44-222',
              expirationDate: '2014-03-01T00:00:00.000Z',
              lot: '331-1'
            }],
            instrument: {
              serial: '444-3'
            },
            module: {
              name: 'ModA',
              serial: '555-8'
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
              phone: '856-7909'
            },
            sender: {
              version: '99-1',
              operator: 'Bob O'
            },
            notes: 'My Awesome notes about this Awesome result!',
            error: {
              code: '123',
              notes: 'Oh NOZE!'
            }
          })
        })
    }))

    it('should set default result status and categories', () => run(function* (knex) {
      const deviceAuth = `Bearer ${sharedDevice.deviceToken}`

      yield server.post(devicePostResultPath)
        .set('Authorization', deviceAuth)
        .send({ data: { a: 'b' }, assay: { id: 'HivVl' } })
        .then((res) => {
          assert.equal(res.status, 200)
          resultIds.push(res.body.id)
        })

      const result1 = yield knex('Result as r')
        .where({ externalId: resultIds[0] }).first()
      assert.equal(result1.externalId, resultIds[0])
      assert.deepEqual(JSON.parse(result1.resultData), { a: 'b' })
      assert.isNotOk(result1.errorCode)

      const result1Status = yield knex('ResultWorkflowStatus as rs')
        .where({ id: result1.resultWorkflowStatusId }).first('externalId')
      assert.equal(result1Status.externalId, 'OK')

      const [result1Category1, result1Category2] = yield knex('ResultCategory as rt')
        .whereIn('id', [result1.resultCategory1, result1.resultCategory2]).select('externalId')
      assert.equal(result1Category1.externalId, 'Success')
      assert.isNotOk(result1Category2)

      yield server.post(devicePostResultPath)
        .set('Authorization', deviceAuth)
        .send({ data: { a: 'c' }, error: { code: '1' }, assay: { id: 'HivVl' } })
        .then((res) => {
          assert.equal(res.status, 200)
          resultIds.push(res.body.id)
        })

      const result2 = yield knex('Result as r')
        .where({ externalId: resultIds[1] }).first()
      assert.equal(result2.externalId, resultIds[1])
      assert.deepEqual(JSON.parse(result2.resultData), { a: 'c' })
      assert.equal(result2.errorCode, '1')

      const result2Status = yield knex('ResultWorkflowStatus as rs')
        .where({ id: result2.resultWorkflowStatusId }).first('externalId')
      assert.equal(result2Status.externalId, 'Error')

      const [result2Category1, result2Category2] = yield knex('ResultCategory as rt')
        .whereIn('id', [result2.resultCategory1, result2.resultCategory2]).select('externalId')
      assert.equal(result2Category1.externalId, 'Error')
      assert.isNotOk(result2Category2)

      yield server.post(devicePostResultPath)
        .set('Authorization', deviceAuth)
        .send({ data: { a: 'd' }, category: { id: 'Invalid' }, error: { code: '1' }, assay: { id: 'HivVl' } })
        .then((res) => {
          assert.equal(res.status, 200)
          resultIds.push(res.body.id)
        })

      const result3 = yield knex('Result as r')
        .where({ externalId: resultIds[2] }).first()
      assert.equal(result3.externalId, resultIds[2])
      assert.deepEqual(JSON.parse(result3.resultData), { a: 'd' })
      assert.equal(result3.errorCode, '1')

      const result3Status = yield knex('ResultWorkflowStatus as rs')
        .where({ id: result3.resultWorkflowStatusId }).first('externalId')
      assert.equal(result3Status.externalId, 'Error')

      const [result3Category1, result3Category2] = yield knex('ResultCategory as rt')
        .whereIn('id', [result3.resultCategory1, result3.resultCategory2]).select('externalId')
      assert.equal(result3Category1.externalId, 'Invalid')
      assert.isNotOk(result3Category2)

      yield server.post(devicePostResultPath)
        .set('Authorization', deviceAuth)
        .send({ data: { a: 'e' }, category: [{ id: 'Detected' }, { id: 'NotDetected' }], assay: { id: 'HivVl' } })
        .then((res) => {
          assert.equal(res.status, 200)
          resultIds.push(res.body.id)
        })

      const result4 = yield knex('Result as r')
        .where({ externalId: resultIds[3] }).first()
      assert.equal(result4.externalId, resultIds[3])
      assert.deepEqual(JSON.parse(result4.resultData), { a: 'e' })
      assert.isNotOk(result4.errorCode)

      const result4Status = yield knex('ResultWorkflowStatus as rs')
        .where({ id: result4.resultWorkflowStatusId }).first('externalId')
      assert.equal(result4Status.externalId, 'OK')

      const [result4Category1, result4Category2] = yield knex('ResultCategory as rt')
        .whereIn('id', [result4.resultCategory1, result4.resultCategory2]).select('externalId')
      assert.equal(result4Category1.externalId, 'Detected')
      assert.equal(result4Category2.externalId, 'NotDetected')
    }))

    it('should merge results with same id', () => run(function* (knex) {
      const deviceAuth = `Bearer ${sharedDevice.deviceToken}`
      resultIds.push(`R1${now}`, `R2${now}`)
      const countResults = () => knex('Result').count('id as cnt').then(([{ cnt }]) => cnt)
      const initialCount = yield countResults()

      yield server.post(devicePostResultPath)
        .set('Authorization', deviceAuth)
        .send({ id: resultIds[0], data: { a: 'b' }, assay: { id: 'HivVl' } })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.equal(res.body.id, resultIds[0])
        })

      let result1 = yield knex('Result as r')
        .where({ externalId: resultIds[0] }).first()
      assert.equal(result1.externalId, resultIds[0])
      assert.deepEqual(JSON.parse(result1.resultData), { a: 'b' })
      assert.isNotOk(result1.errorCode)
      assert.equal(initialCount + 1, yield countResults())

      yield server.post(devicePostResultPath)
        .set('Authorization', deviceAuth)
        .send({ id: resultIds[0], data: { a: 'b', c: 'd' }, assay: { id: 'HivVl' } })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.equal(res.body.id, resultIds[0])
        })

      result1 = yield knex('Result as r')
        .where({ externalId: resultIds[0] }).first()
      assert.equal(result1.externalId, resultIds[0])
      assert.deepEqual(JSON.parse(result1.resultData), { a: 'b', c: 'd' })
      assert.isNotOk(result1.errorCode)
      assert.equal(initialCount + 1, yield countResults())

      yield server.post(devicePostResultPath)
        .set('Authorization', deviceAuth)
        .send({ id: resultIds[1], data: { a: 'b' }, assay: { id: 'HivVl' } })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.equal(res.body.id, resultIds[1])
        })

      let result2 = yield knex('Result as r')
        .where({ externalId: resultIds[1] }).first()
      assert.equal(result2.externalId, resultIds[1])
      assert.equal(initialCount + 2, yield countResults())

      const result1SampleSite = yield knex('Site as s')
        .where({ id: result1.siteId }).first()

      const result2SampleSite = yield knex('Site as s')
        .where('partnerId', result1SampleSite.partnerId)
        .where('id', '<>', result1.siteId)
        .first()

      yield server.post(devicePostResultPath)
        .set('Authorization', deviceAuth)
        .send({
          id: resultIds[1],
          data: { a: 'b', c: 2, d: false, e: { f: 'g' } },
          type: { id: 'Study' },
          workflow: { status: { id: 'Acknowledged' } },
          category: [
            { id: 'Detected' },
            { id: 'Indeterminate' }
          ],
          assay: {
            id: 'MtbRif',
            version: '1a.c1'
          },
          sample: {
            id: `Sample${now}`,
            originSite: {
              id: result2SampleSite.externalId
            }
          },
          location: {
            longitude: -87.581222,
            latitude: 30.419348
          },
          startedOn: '2013-12-01',
          endedOn: '2013-12-01T01:30',
          consumable: {
            serial: '132-44-222',
            expirationDate: '2014-03-01',
            lot: '331-1'
          },
          instrument: {
            serial: '444-3'
          },
          module: {
            name: 'ModA',
            serial: '555-8'
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
            phone: '856-7909'
          },
          sender: {
            version: '99-1',
            operator: 'Bob O'
          },
          notes: 'My Awesome notes about this Awesome result!',
          error: {
            code: '123',
            notes: 'Oh NOZE!'
          }
        })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'id')
          resultIds.push(res.body.id)
        })

      result2 = yield knex('Result as r')
        .where({ externalId: resultIds[1] }).first()
      assert.equal(initialCount + 2, yield countResults())
      assert.equal(result2.externalId, resultIds[1])
      assert.deepEqual(JSON.parse(result2.resultData), { a: 'b', c: 2, d: false, e: { f: 'g' } })
      assert.equal(result2.assayVersion, '1a.c1')
      assert.approximately(result2.latitude, 30.419348, 0.000001)
      assert.approximately(result2.longitude, -87.581222, 0.000001)
      assert.deepEqual(result2.startedOn, new Date('2013-12-01'))
      assert.deepEqual(result2.endedOn, new Date('2013-12-01T01:30'))
      assert.equal(result2.consumableSerial, '132-44-222')
      assert.deepEqual(result2.consumableExpirationDate, new Date('2014-03-01'))
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
        phone: '856-7909'
      })
      assert.equal(result2.senderVersion, '99-1')
      assert.equal(result2.senderOperator, 'Bob O')
      assert.equal(result2.notes, 'My Awesome notes about this Awesome result!')
      assert.equal(result2.errorCode, '123')
      assert.equal(result2.errorNotes, 'Oh NOZE!')

      const result2Type = yield knex('ResultType as rt')
        .where({ id: result2.resultTypeId }).first('externalId')
      assert.equal(result2Type.externalId, 'Study')

      const result2Status = yield knex('ResultWorkflowStatus as rs')
        .where({ id: result2.resultWorkflowStatusId }).first('externalId')
      assert.equal(result2Status.externalId, 'Acknowledged')

      const result2Assay = yield knex('Assay as assay')
        .where({ id: result2.assayId }).first('externalId', 'name')
      assert.equal(result2Assay.externalId, 'MtbRif')
      assert.equal(result2Assay.name, 'GeneXpert MTB/Rif')

      const result2Sample = yield knex('Sample as s')
        .where({ id: result2.sampleId }).first()

      assert.notEqual(result2.siteId, result2Sample.originSiteId)
      assert.equal(result2SampleSite.id, result2Sample.originSiteId)
      assert.equal(result2Sample.externalId, `Sample${now}`)

      const [result2Category1, result2Category2] = yield knex('ResultCategory as rt')
        .whereIn('id', [result2.resultCategory1, result2.resultCategory2]).select('externalId')
      assert.equal(result2Category1.externalId, 'Detected')
      assert.equal(result2Category2.externalId, 'Indeterminate')
    }))

    it('should add and return device data', () => run(function* (knex) {
      const { deviceId } = sharedDevice

      const configIds = []
      const opIds = []

      const deviceAuth = `Bearer ${sharedDevice.deviceToken}`

      const [{ count: initialLogLength }] = yield knex('DeviceLogUpdate').count('id as count')

      const [{ prevConfigId }] = yield knex('Device').where({ id: deviceId })
        .select('deviceConfigurationId as prevConfigId')

      const [{ prevOpId }] = yield knex('Device').where({ id: deviceId })
        .select('deviceOperationId as prevOpId')

      yield server.get(devicePath)
        .set('Authorization', deviceAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

      yield server.get(devicePath)
        .set('Authorization', deviceAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

      let prevResults
      let results

      yield server.get(deviceGetResultPath)
        .set('Authorization', deviceAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'array')
          results = res.body
          prevResults = results
        })

      yield server.post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          checkpoint: 'ck123',
          configuration: { data: { a: 'b' } },
          operation: { data: { a: 'c' } },
          result: { data: { a: 'd' }, assay: { id: 'HivVl' } }
        })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'configuration')
          assert.property(res.body.configuration, 'id')
          configIds.push(res.body.configuration.id)
          assert.typeOf(res.body.operation, 'Object')
          assert.property(res.body.operation, 'id')
          opIds.push(res.body.operation.id)
          assert.typeOf(res.body.result, 'Object')
          assert.property(res.body.result, 'id')
          resultIds.push(res.body.result.id)
        })

      const [{ count: logLength2 }] = yield knex('DeviceLogUpdate').count('id as count')
      assert.equal(logLength2, initialLogLength + 1)

      const deviceLogResult2 = yield knex('Result')
        .where({ externalId: resultIds[resultIds.length - 1] })
        .first()
      const deviceLogConfig2 = yield knex('DeviceConfiguration')
        .where({ externalId: configIds[configIds.length - 1] })
        .first()
      const deviceLogOp2 = yield knex('DeviceOperation')
        .where({ externalId: opIds[opIds.length - 1] })
        .first()
      assert.property(deviceLogOp2, 'data')
      assert.deepEqual(JSON.parse(deviceLogOp2.data), { a: 'c' })
      assert.property(deviceLogConfig2, 'data')
      assert.deepEqual(JSON.parse(deviceLogConfig2.data), { a: 'b' })
      assert.property(deviceLogResult2, 'resultData')
      assert.deepEqual(JSON.parse(deviceLogResult2.resultData), { a: 'd' })
      const deviceLogUpdates2 = yield knex('DeviceLogUpdate').where({
        deviceConfigurationId: deviceLogConfig2.id,
        deviceOperationId: deviceLogOp2.id
      })
      assert.equal(deviceLogUpdates2.length, 1)
      assert.isOk(deviceLogUpdates2[0].deviceLogId)
      assert.equal(deviceLogUpdates2[0].resultId, deviceLogResult2.id)

      yield server.get(devicePath)
        .set('Authorization', deviceAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'checkpoint')
          assert.equal(res.body.checkpoint, 'ck123')
        })

      yield server.get(deviceGetResultPath)
        .set('Authorization', deviceAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'array')

          const lastResult = _.find(res.body, { id: resultIds[0] })
          assert.typeOf(lastResult, 'Object')
          assert.deepEqual(lastResult.data, { a: 'd' })

          results = res.body
          assert.equal(results.length, prevResults.length + 1)
        })

      yield server.post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          configuration: { data: { a: 'c' } },
          operation: { data: { a: 'd' } },
          result: [
            { data: { a: 'c' }, assay: { id: 'HivVl' } },
            { data: { a: 'd' }, assay: { id: 'HivVl' } }
          ]
        })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'configuration')
          assert.property(res.body.configuration, 'id')
          configIds.push(res.body.configuration.id)
          assert.typeOf(res.body.operation, 'Object')
          assert.property(res.body.operation, 'id')
          opIds.push(res.body.operation.id)
          assert.typeOf(res.body.result, 'Object')
          assert.property(res.body.result, 'id')
          resultIds.push(res.body.result.id)
        })

      const [{ count: logLength3 }] = yield knex('DeviceLogUpdate').count('id as count')
      assert.equal(logLength3, initialLogLength + 3)

      const deviceLogConfig3 = yield knex('DeviceConfiguration')
        .where({ externalId: configIds[configIds.length - 1] })
        .first()
      const deviceLogOp3 = yield knex('DeviceOperation')
        .where({ externalId: opIds[opIds.length - 1] })
        .first()
      assert.property(deviceLogOp3, 'data')
      assert.deepEqual(JSON.parse(deviceLogOp3.data), { a: 'd' })
      assert.property(deviceLogConfig3, 'data')
      assert.deepEqual(JSON.parse(deviceLogConfig3.data), { a: 'c' })
      const deviceLogUpdates3 = yield knex('DeviceLogUpdate').where({
        deviceConfigurationId: deviceLogConfig3.id,
        deviceOperationId: deviceLogOp3.id
      })
      assert.equal(deviceLogUpdates3.length, 2)
      assert.isOk(deviceLogUpdates3[0].deviceLogId)
      assert.equal(deviceLogUpdates3[0].deviceLogId, deviceLogUpdates3[1].deviceLogId)
      assert.isOk(deviceLogUpdates3[0].resultId)
      assert.isOk(deviceLogUpdates3[1].resultId)
      assert.notEqual(deviceLogUpdates3[0].resultId, deviceLogUpdates3[1].resultId)

      yield server.get(deviceGetResultPath)
        .set('Authorization', deviceAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'array')

          const result1 = _.find(res.body, { id: resultIds[1] })
          assert.typeOf(result1, 'Object')

          results = res.body
          assert.equal(results.length, prevResults.length + 3)
        })

      const newResults = _.differenceBy(results, prevResults, 'id')
      assert.equal(newResults.length, 3)

      resultIds.push(..._.map(newResults, 'id'))

      // cleanup
      const deviceLogIds = yield knex('DeviceLogUpdate as dlu')
        .leftJoin('DeviceConfiguration as c', 'dlu.deviceConfigurationId', 'c.id')
        .leftJoin('DeviceOperation as o', 'dlu.deviceOperationId', 'o.id')
        .leftJoin('Result as r', 'dlu.resultId', 'r.id')
        .whereIn('c.externalId', configIds)
        .orWhereIn('o.externalId', opIds)
        .select('dlu.deviceLogId')
        .map(dlu => dlu.deviceLogId)

      yield knex('AuditLog').whereIn('deviceLogId', deviceLogIds).delete()
      yield knex('DeviceLogUpdate').whereIn('deviceLogId', deviceLogIds).delete()
      yield knex('DeviceLog').whereIn('id', deviceLogIds).delete()

      const [{ count: logLength4 }] = yield knex('DeviceLogUpdate').count('id as count')
      assert.equal(logLength4, initialLogLength)

      yield knex('Device').where({ id: deviceId }).update({ deviceOperationId: prevOpId })
      yield knex('DeviceOperation').whereIn('externalId', opIds).delete()

      yield knex('Device').where({ id: deviceId }).update({ deviceConfigurationId: prevConfigId })
      yield knex('DeviceConfiguration').whereIn('externalId', configIds).delete()
    }))
  })

  describe('rrt_admin lab/clinic results', () => {
    const resultIds = []

    sharedDevice.authenticateUserAndFirstDevice(server, { user: 'rrt_admin', type: 'm2000' })

    const devicePostResultPath = '/device/result'

    afterEach(() => run(function* (knex) {
      // cleanup
      if (resultIds.length > 0) {
        const deviceLogIds = yield knex('DeviceLogUpdate as dlu')
          .innerJoin('Result as r', 'dlu.resultId', 'r.id')
          .whereIn('r.externalId', resultIds)
          .select('dlu.deviceLogId')
          .map(dlu => dlu.deviceLogId)

        yield knex('AuditLog').whereIn('deviceLogId', deviceLogIds).delete()
        yield knex('DeviceLogUpdate').whereIn('deviceLogId', deviceLogIds).delete()
        yield knex('DeviceLog').whereIn('id', deviceLogIds).delete()
        yield knex('Result').whereIn('externalId', resultIds).delete()

        resultIds.splice(0)
      }
    }))

    it('should honor device role sample origin site', () => run(function* (knex) {
      const deviceAuth = `Bearer ${sharedDevice.deviceToken}`
      const deviceGetResultPath = devicePostResultPath

      const [device1315, device1723] = yield knex('Device as d')
        .join('Site as s', 'd.siteId', 's.id')
        .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .whereIn('s.externalId', ['1315', '1723'])
        .where('dt.name', 'RRT')
        .orderBy('s.externalId')
        .select('d.*')

      const device1315Key = yield sharedDevice.getApiKey(server, device1315.id)
      const device1723Key = yield sharedDevice.getApiKey(server, device1723.id)

      const device1315Auth = `Bearer ${device1315Key}`
      const device1723Auth = `Bearer ${device1723Key}`

      yield server.post(devicePostResultPath)
        .set('Authorization', deviceAuth)
        .send({
          data: {
            resultText: '454112',
            copies: 454112
          },
          sample: {
            originSite: {
              id: '1315'
            }
          },
          notes: '454,112 Copies / mL'
        })
        .then((res) => {
          assert.equal(res.status, 200)
          resultIds.push(res.body.id)
        })

      yield server.get(deviceGetResultPath)
        .set('Authorization', deviceAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'array')

          const lastResult = _.find(res.body, { id: resultIds[0] })
          assert.typeOf(lastResult, 'Object')
          assert.property(lastResult, 'endedOn')
          assert.property(lastResult.sample, 'id')
          assert.property(lastResult.sample.originSite, 'id')
          assert.equal(lastResult.sample.originSite.id, '1315')

          assert.deepEqual(_.omit(lastResult, 'endedOn', 'sample'), {
            id: resultIds[0],
            data: {
              resultText: '454112',
              copies: 454112
            },
            assay: { id: 'HivVl' },
            category: [{ id: 'Success' }],
            type: { id: 'Patient' },
            workflow: { status: { id: 'OK' } },
            notes: '454,112 Copies / mL'
          })
        })

      yield server.get(deviceGetResultPath)
        .set('Authorization', device1315Auth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'array')

          const lastResult = _.find(res.body, { id: resultIds[0] })
          assert.typeOf(lastResult, 'Object')
          assert.property(lastResult, 'endedOn')
          assert.property(lastResult.sample, 'id')
          assert.property(lastResult.sample.originSite, 'id')
          assert.equal(lastResult.sample.originSite.id, '1315')

          assert.deepEqual(_.omit(lastResult, 'endedOn', 'sample'), {
            id: resultIds[0],
            data: {
              resultText: '454112',
              copies: 454112
            },
            assay: { id: 'HivVl' },
            category: [{ id: 'Success' }],
            type: { id: 'Patient' },
            workflow: { status: { id: 'OK' } },
            notes: '454,112 Copies / mL'
          })
        })

      yield server.get(deviceGetResultPath)
        .set('Authorization', device1723Auth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'array')

          const lastResult = _.find(res.body.data, { id: resultIds[0] })
          assert.typeOf(lastResult, 'undefined')
        })

      yield server.post(devicePostResultPath)
        .set('Authorization', deviceAuth)
        .send({
          data: {
            resultText: '154112',
            copies: 154112
          },
          sample: {
            originSite: {
              id: '1723'
            }
          },
          notes: '154,112 Copies / mL'
        })
        .then((res) => {
          assert.equal(res.status, 200)
          resultIds.push(res.body.id)
        })

      yield server.get(deviceGetResultPath)
        .set('Authorization', deviceAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'array')

          const lastResult = _.find(res.body, { id: resultIds[1] })
          assert.typeOf(lastResult, 'Object')
          assert.property(lastResult, 'endedOn')
          assert.property(lastResult.sample, 'id')
          assert.property(lastResult.sample.originSite, 'id')
          assert.equal(lastResult.sample.originSite.id, '1723')

          assert.deepEqual(_.omit(lastResult, 'endedOn', 'sample'), {
            id: resultIds[1],
            data: {
              resultText: '154112',
              copies: 154112
            },
            assay: { id: 'HivVl' },
            category: [{ id: 'Success' }],
            type: { id: 'Patient' },
            workflow: { status: { id: 'OK' } },
            notes: '154,112 Copies / mL'
          })
        })

      yield server.get(deviceGetResultPath)
        .set('Authorization', device1723Auth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'array')

          const lastResult = _.find(res.body, { id: resultIds[1] })
          assert.typeOf(lastResult, 'Object')
          assert.property(lastResult, 'endedOn')
          assert.property(lastResult.sample, 'id')
          assert.property(lastResult.sample.originSite, 'id')
          assert.equal(lastResult.sample.originSite.id, '1723')

          assert.deepEqual(_.omit(lastResult, 'endedOn', 'sample'), {
            id: resultIds[1],
            data: {
              resultText: '154112',
              copies: 154112
            },
            assay: { id: 'HivVl' },
            category: [{ id: 'Success' }],
            type: { id: 'Patient' },
            workflow: { status: { id: 'OK' } },
            notes: '154,112 Copies / mL'
          })
        })

      yield server.get(deviceGetResultPath)
        .set('Authorization', device1315Auth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'array')

          const lastResult = _.find(res.body, { id: resultIds[1] })
          assert.typeOf(lastResult, 'undefined')
        })

      yield server.post(devicePostResultPath)
        .set('Authorization', device1723Auth)
        .send({
          id: resultIds[1],
          workflow: { status: { id: 'Acknowledged' } }
        })
        .then((res) => {
          assert.equal(res.status, 200)
          resultIds.push(res.body.id)
        })

      yield server.post(devicePostResultPath)
        .set('Authorization', device1723Auth)
        .send({
          id: resultIds[0],
          workflow: { status: { id: 'Acknowledged' } }
        })
        .then((res) => {
          // Device 1723 does not have access to resultIds[0]
          assert.equal(res.status, 400)
        })

      yield server.get(deviceGetResultPath)
        .set('Authorization', deviceAuth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'array')

          const lastResult = _.find(res.body, { id: resultIds[1] })
          assert.typeOf(lastResult, 'Object')
          assert.property(lastResult, 'endedOn')
          assert.property(lastResult.sample, 'id')
          assert.property(lastResult.sample.originSite, 'id')
          assert.equal(lastResult.sample.originSite.id, '1723')

          assert.deepEqual(_.omit(lastResult, 'endedOn', 'sample'), {
            id: resultIds[1],
            workflow: { status: { id: 'Acknowledged' } },
            data: {
              resultText: '154112',
              copies: 154112
            },
            assay: { id: 'HivVl' },
            category: [{ id: 'Success' }],
            type: { id: 'Patient' },
            notes: '154,112 Copies / mL'
          })
        })

      yield server.get(deviceGetResultPath)
        .set('Authorization', device1723Auth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'array')

          const lastResult = _.find(res.body, { id: resultIds[1] })
          assert.typeOf(lastResult, 'Object')
          assert.property(lastResult, 'endedOn')
          assert.property(lastResult.sample, 'id')
          assert.property(lastResult.sample.originSite, 'id')
          assert.equal(lastResult.sample.originSite.id, '1723')

          assert.deepEqual(_.omit(lastResult, 'endedOn', 'sample'), {
            id: resultIds[1],
            data: {
              resultText: '154112',
              copies: 154112
            },
            assay: { id: 'HivVl' },
            category: [{ id: 'Success' }],
            type: { id: 'Patient' },
            workflow: { status: { id: 'Acknowledged' } },
            notes: '154,112 Copies / mL'
          })
        })

      yield server.get(deviceGetResultPath)
        .set('Authorization', device1315Auth)
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'array')

          const lastResult = _.find(res.body, { id: resultIds[1] })
          assert.typeOf(lastResult, 'undefined')
        })
    }))


    // other tests assume admin is authenticated so reset
    sharedDevice.authenticateUserAndFirstDevice(server, { user: 'admin', type: 'GeneXpert' })
  })
})
