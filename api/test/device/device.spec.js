let supertest = require('supertest')
let chai = require('chai')
let _ = require('lodash')
let shared = require('../utils/sharedToken')
const { transact } = require('../../src/db')

// This agent refers to PORT where program is runninng.
let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('Device routes',function(){

  let path = '/api/device'

  describe('GET',function(){

    shared.checkToken(server, path)

    it('should return a list of devices when using valid token', function(done){
      server
      .get(path)
      .set('Authorization', 'Bearer '+shared.token)
      .end(function(err,res){
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'array')
        assert.isAtLeast(res.body.data.length, 3)
        assert.property(res.body.data[0], 'id')
        assert.property(res.body.data[0], 'name')
        assert.property(res.body.data[0], 'shortname')
        assert.property(res.body.data[0], 'createdOn')
        assert.property(res.body.data[0], 'lastPingOn')
        assert.property(res.body.data[0], 'lastSeen')
        assert.property(res.body.data[0], 'type')
        assert.property(res.body.data[0], 'category')
        assert.property(res.body.data[0], 'hasResults')
        assert.property(res.body.data[0], 'hasConnectivity')
        assert.property(res.body.data[0], 'status')
        assert.property(res.body.data[0], 'totalTests')
        assert.property(res.body, 'total')
        done()
      })
    })

    it('should return only medical devices if hasResults=1', function(done){
      server
      .get(path + '?hasResults=1&page=0&size=100')
      .set('Authorization', 'Bearer '+shared.token)
      .end(function(err,res){
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'array')
        assert.isAtLeast(res.body.data.length, 3)
        assert.property(res.body.data[0], 'id')
        assert.property(res.body.data[0], 'name')
        assert.property(res.body.data[0], 'shortname')
        assert.property(res.body.data[0], 'createdOn')
        assert.property(res.body.data[0], 'lastPingOn')
        assert.property(res.body.data[0], 'lastSeen')
        assert.property(res.body.data[0], 'type')
        assert.property(res.body.data[0], 'category')
        assert.property(res.body.data[0], 'hasResults')
        assert.property(res.body.data[0], 'hasConnectivity')
        assert.property(res.body.data[0], 'status')
        assert.property(res.body.data[0], 'totalTests')
        assert.equal(_.every(res.body.data, (d) => { return d.hasResults === 1 }), true)
        assert.property(res.body, 'total')
        done()
      })
    })

    it('should return only devices that have connectivity hardware if hasConnectivity=1', function(done){
      server
      .get(path + '?hasConnectivity=1&page=0&size=100')
      .set('Authorization', 'Bearer '+shared.token)
      .end(function(err,res){
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'array')
        assert.isAtLeast(res.body.data.length, 3)
        assert.property(res.body.data[0], 'id')
        assert.property(res.body.data[0], 'name')
        assert.property(res.body.data[0], 'shortname')
        assert.property(res.body.data[0], 'createdOn')
        assert.property(res.body.data[0], 'lastPingOn')
        assert.property(res.body.data[0], 'lastSeen')
        assert.property(res.body.data[0], 'type')
        assert.property(res.body.data[0], 'category')
        assert.property(res.body.data[0], 'hasResults')
        assert.property(res.body.data[0], 'hasConnectivity')
        assert.property(res.body.data[0], 'status')
        assert.property(res.body.data[0], 'totalTests')
        assert.equal(_.every(res.body.data, (d) => { return d.hasConnectivity === 1 }), true)
        assert.property(res.body, 'total')
        done()
      })
    })

  })

  describe('POST',function(){
  })

  describe('configuration', function(){
    shared.checkToken(server, path)

    it.only('should add and return device configuration', () => transact(function*(knex){
      const deviceId = 17
      let initialDataLength = 0
      const configIds = []

      const [{prevConfigId}] = yield knex('Device').where({id: deviceId})
        .select('deviceConfigurationId as prevConfigId')

      yield server.get(`${path}/${deviceId}/configuration`)
        .set('Authorization', 'Bearer '+shared.token)
        .then(function(res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 0)
          initialDataLength = res.body.data.length
          assert.property(res.body, 'total')
        })

      yield server.post(`${path}/${deviceId}/configuration`)
        .set('Authorization', 'Bearer '+shared.token)
        .send({data: {a:'b'}})
        .then(function(res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.equal(res.body.ok, true)
          assert.typeOf(res.body.data, 'Object')
          assert.property(res.body.data, 'id')
          configIds.push(res.body.data.id)
        })

      yield server.get(`${path}/${deviceId}/configuration`)
        .set('Authorization', 'Bearer '+shared.token)
        .then(function(res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.property(res.body, 'total')

          assert.equal(res.body.data.length, initialDataLength + 1)
          const lastConfig = _.find(res.body.data, {id: configIds[0]})
          assert.typeOf(lastConfig, 'Object')
          assert.equal(lastConfig.id, configIds[0])
          assert.deepEqual(lastConfig.data, {a:'b'})
        })

      yield server.post(`${path}/${deviceId}/configuration`)
        .set('Authorization', 'Bearer '+shared.token)
        .send({data: {a:'b', c:2, d:false, e:{f: 'g'}}})
        .then(function(res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.equal(res.body.ok, true)
          assert.typeOf(res.body.data, 'Object')
          assert.property(res.body.data, 'id')
          configIds.push(res.body.data.id)
        })

      yield server.get(`${path}/${deviceId}/configuration`)
        .set('Authorization', 'Bearer '+shared.token)
        .then(function(res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.property(res.body, 'total')

          assert.equal(res.body.data.length, initialDataLength + 2)

          const prevConfig = _.find(res.body.data, {id: configIds[0]})
          assert.typeOf(prevConfig, 'Object')
          assert.equal(prevConfig.id, configIds[0])
          assert.deepEqual(prevConfig.data, {a:'b'})

          const lastConfig = _.find(res.body.data, {id: configIds[1]})
          assert.typeOf(lastConfig, 'Object')
          assert.equal(lastConfig.id, configIds[1])
          assert.deepEqual(lastConfig.data, {a:'b', c:2, d:false, e:{f:'g'}})
        })

      // cleanup
      yield knex('Device').where({id: deviceId}).update({deviceConfigurationId: prevConfigId})
      yield knex('DeviceConfiguration').whereIn('id', configIds).delete()
      yield server.get(`${path}/${deviceId}/configuration`)
        .set('Authorization', 'Bearer '+shared.token)
        .then(function(res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 0)
          initialDataLength = res.body.data.length
          assert.property(res.body, 'total')
        })
    }))
  })
})
