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
          type: {id: 'Study'}})
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
      const result2Type = yield knex('ResultType as rt')
        .where({id: result2.resultTypeId}).first('externalId')
      assert.equal(result2Type.externalId, 'Study')

      const [{rawMessage: log2Raw, resultId: resultId2}] = yield knex('ResultLog as rl')
        .innerJoin('Result as r', 'r.id', 'rl.resultId')
        .where({externalId: resultIds[1]}).select('rawMessage', 'resultId')
      assert.deepEqual(JSON.parse(log2Raw), {
        data: {a: 'b', c: 2, d: false, e: {f: 'g'}},
        type: {id: 'Study'}
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
