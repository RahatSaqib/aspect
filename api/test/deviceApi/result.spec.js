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
          const lastConfig = _.find(res.body.data, {id: resultIds[0]})
          assert.typeOf(lastConfig, 'Object')
          assert.equal(lastConfig.id, resultIds[0])
        })

      const [{rawMessage: log1Raw}] = yield knex('ResultLog')
        .where({resultId: resultIds[0]}).select('rawMessage')
      assert.deepEqual(JSON.parse(log1Raw), {data: {a: 'b'}})

      yield server.get(clientSingleResultPath+resultIds[0])
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
        .send({data: {a:'b', c:2, d:false, e:{f: 'g'}}})
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

          const prevConfig = _.find(res.body.data, {id: resultIds[0]})
          assert.typeOf(prevConfig, 'Object')
          assert.equal(prevConfig.id, resultIds[0])

          const lastConfig = _.find(res.body.data, {id: resultIds[1]})
          assert.typeOf(lastConfig, 'Object')
          assert.equal(lastConfig.id, resultIds[1])
        })

      const [{rawMessage: log2Raw}] = yield knex('ResultLog')
        .where({resultId: resultIds[1]}).select('rawMessage')
      assert.deepEqual(JSON.parse(log2Raw), {data: {a:'b', c:2, d:false, e:{f: 'g'}}})

      yield server.get(clientSingleResultPath+resultIds[0])
        .set('Authorization', clientAuth)
        .then(function(res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.typeOf(res.body.data, 'Object')
          assert.typeOf(res.body.data.resultData, 'Object')
          assert.deepEqual(res.body.data.resultData, {a:'b'})
        })

      yield server.get(clientSingleResultPath+resultIds[1])
        .set('Authorization', clientAuth)
        .then(function(res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.typeOf(res.body.data, 'Object')
          assert.typeOf(res.body.data.resultData, 'Object')
          assert.deepEqual(res.body.data.resultData, {a:'b', c:2, d:false, e:{f:'g'}})
        })


      // cleanup
      yield knex('ResultLog').whereIn('resultId', resultIds).delete()
      const [{count: logLengthClean}] = yield knex('ResultLog').count('id as count')
      assert.equal(logLengthClean, initialLogLength)

      yield knex('Result').whereIn('id', resultIds).delete()
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
