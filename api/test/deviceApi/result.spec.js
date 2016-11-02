const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const shared = require('../utils/sharedToken')
const sharedDevice = require('./deviceToken')

const { run } = require('../../src/db')

// This agent refers to PORT where program is runninng.
let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('Device Result API routes',function(){
  describe('result', function(){

    let clientPath = '/api/result'
    shared.checkToken(server, clientPath)
    sharedDevice.authenticateUserAndFirstDevice(server, 'admin')

    const devicePath = '/device/result'

    it('should add and return device results', () => run(function*(knex){

      const {deviceId} = sharedDevice
      const clientSingleResultPath = clientPath+'/'
      clientPath += ('?deviceId='+deviceId)

      let initialDataLength = 0
      const resultIds = []

      const clientAuth = 'Bearer '+shared.token
      const deviceAuth = 'Bearer '+sharedDevice.deviceToken

      const [{count: initialLogLength}] = yield knex('ResultLog').count('id as count')

      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then(function(res){
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
        .send({data: {a:'b'}})
        .then(function(res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.equal(res.body.ok, true)
          assert.typeOf(res.body.data, 'Object')
          assert.property(res.body.data, 'id')
          resultIds.push(res.body.data.id)
        })

      const [{count: logLength1}] = yield knex('ResultLog').count('id as count')
      assert.equal(logLength1, initialLogLength + 1)

      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then(function(res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.property(res.body, 'total')

          assert.equal(res.body.data.length, initialDataLength + 1)
          const lastResult = _.find(res.body.data, {externalId: resultIds[0]})
          assert.typeOf(lastResult, 'Object')
          assert.equal(lastResult.externalId, resultIds[0])
        })

      const result1 = yield knex('Result as r')
        .where({externalId: resultIds[0]}).first()
      assert.equal(result1.externalId, resultIds[0])
      assert.deepEqual(JSON.parse(result1.resultData), {a: 'b'})
      const result1Type = yield knex('ResultType as rt')
        .where({id: result1.resultTypeId}).first('externalId')
      assert.equal(result1Type.externalId, 'Patient')

      const [{rawMessage: log1Raw, resultId: resultId1}] = yield knex('ResultLog as rl')
        .innerJoin('Result as r', 'r.id', 'rl.resultId')
        .where({externalId: resultIds[0]}).select('rawMessage', 'resultId')
      assert.deepEqual(JSON.parse(log1Raw), {data: {a: 'b'}})

      yield server.get(clientSingleResultPath+resultId1)
        .set('Authorization', clientAuth)
        .then(function(res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.typeOf(res.body.data, 'Object')
          assert.typeOf(res.body.data.resultData, 'Object')
          assert.deepEqual(res.body.data.resultData, {a:'b'})
        })

      yield server.post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          data: {a: 'b', c: 2, d: false, e: {f: 'g'}},
          type: {id: 'Study'},
          assay: {
            version: '1a.c1'
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
          research: {id: 'R123'},
          patient: {id: 'P-333'},
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
        .then(function(res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.equal(res.body.ok, true)
          assert.typeOf(res.body.data, 'Object')
          assert.property(res.body.data, 'id')
          resultIds.push(res.body.data.id)
        })

      const [{count: logLength2}] = yield knex('ResultLog').count('id as count')
      assert.equal(logLength2, initialLogLength + 2)

      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then(function(res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.property(res.body, 'total')

          assert.equal(res.body.data.length, initialDataLength + 2)

          const prevResult = _.find(res.body.data, {externalId: resultIds[0]})
          assert.typeOf(prevResult, 'Object')
          assert.equal(prevResult.externalId, resultIds[0])

          const lastResult = _.find(res.body.data, {externalId: resultIds[1]})
          assert.typeOf(lastResult, 'Object')
          assert.equal(lastResult.externalId, resultIds[1])
        })

      const result2 = yield knex('Result as r')
        .where({externalId: resultIds[1]}).first()
      assert.equal(result2.externalId, resultIds[1])
      assert.deepEqual(JSON.parse(result2.resultData), {a: 'b', c: 2, d: false, e: {f: 'g'}})
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
      assert.equal(result2.patientId, 'P-333')
      assert.equal(result2.senderVersion, '99-1')
      assert.equal(result2.senderOperator, 'Bob O')
      assert.equal(result2.notes, 'My Awesome notes about this Awesome result!')
      assert.equal(result2.errorCode, '123')
      assert.equal(result2.errorNotes, 'Oh NOZE!')

      const result2Type = yield knex('ResultType as rt')
        .where({id: result2.resultTypeId}).first('externalId')
      assert.equal(result2Type.externalId, 'Study')


      const [{rawMessage: log2Raw, resultId: resultId2}] = yield knex('ResultLog as rl')
        .innerJoin('Result as r', 'r.id', 'rl.resultId')
        .where({externalId: resultIds[1]}).select('rawMessage', 'resultId')
      assert.deepEqual(JSON.parse(log2Raw), {
        data: {a: 'b', c: 2, d: false, e: {f: 'g'}},
        type: {id: 'Study'},
        assay: {
          version: '1a.c1'
        },
        location: {
          longitude: -87.581222,
          latitude: 30.419348
        },
        // TODO ResultLog should be raw payload (before transformation during validation)
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
        research: {id: 'R123'},
        patient: {id: 'P-333'},
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

      yield server.get(clientSingleResultPath+resultId2)
        .set('Authorization', clientAuth)
        .then(function(res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.typeOf(res.body.data, 'Object')
          assert.typeOf(res.body.data.resultData, 'Object')
          assert.deepEqual(res.body.data.resultData, {a:'b', c:2, d:false, e:{f: 'g'}})
        })

      yield server.get(clientSingleResultPath+resultId2)
        .set('Authorization', clientAuth)
        .then(function(res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.typeOf(res.body.data, 'Object')
          assert.typeOf(res.body.data.resultData, 'Object')
          assert.deepEqual(res.body.data.resultData, {a:'b', c:2, d:false, e:{f:'g'}})
        })


      // cleanup
      yield knex('ResultLog').whereIn('resultId',
        knex('Result').whereIn('externalId', resultIds).select('id')).delete()
      const [{count: logLengthClean}] = yield knex('ResultLog').count('id as count')
      assert.equal(logLengthClean, initialLogLength)

      yield knex('Result').whereIn('externalId', resultIds).delete()
      yield server.get(clientPath)
        .set('Authorization', clientAuth)
        .then(function(res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.equal(res.body.data.length, initialDataLength)
          assert.property(res.body, 'total')
        })
    }))
  })
})
