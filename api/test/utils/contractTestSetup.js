require('dotenv-safe').load()

let supertest = require('supertest')
let jwt = require('jsonwebtoken')
let chai = require('chai')
let shared = require('../shared_tests')
let config = require('./../../../src/config')
let serverUrl = 'http://localhost:8080',
  server = supertest.agent(serverUrl),
  attemptsToConnect = 0,
  assert = chai.assert

function attemptToConnect(done) {
  if (attemptsToConnect === 3) {
    done()
  }
  setTimeout(function () {
    server.get('/')
      .end(function(err,res){
        if(err || !res || res.status !== 200) {
          attemptsToConnect++
          attemptToConnect(done)
        } else {
          done()
        }
      })
  }, 1000)
}

before(function (done) {
  //Wait until server is up and running
  attemptToConnect(done)
})

let jwToken = ''
let refreshToken = ''
let clientId = ''

it('User should be able to login',function(done){
  server
    .post('/api/auth')
    .send({ name: 'admin', password: 'test07', clientName: 'Mocha/Chai' })
    .end(function(err,res){
      assert.equal(res.status, 200)
      assert.isAbove(res.body.access.length, 100)
      assert.isAbove(res.body.refresh.length, 50)
      assert.isAbove(res.body.clientId.length, 32)
      jwToken = res.body.access
      shared.token = jwToken
      refreshToken = res.body.refresh
      clientId = res.body.clientId
      jwt.verify(res.body.access, config.secret, function (err, decoded) {
        assert.isNotOk(err)
        assert.property(decoded, 'name')
        assert.property(decoded, 'modules')
        assert.property(decoded, 'roles')
        assert.property(decoded, 'iat')
        assert.property(decoded, 'exp')
        assert.property(decoded, 'iss')
        done()
      })
    })
})

it('should be able to get a refresh token',function(done){
  server
    .post('/api/auth/refresh')
    .send({ clientId: clientId, token: refreshToken })
    .end(function(err,res){
      assert.equal(res.status, 200)
      assert.isAbove(res.body.access.length, 100)
      assert.isAbove(res.body.refresh.length, 50)
      assert.isAbove(res.body.clientId.length, 32)
      jwToken = res.body.access
      shared.token = jwToken
      jwt.verify(res.body.access, config.secret, function (err, decoded) {
        assert.isNotOk(err)
        assert.property(decoded, 'name')
        assert.property(decoded, 'modules')
        assert.property(decoded, 'roles')
        assert.property(decoded, 'iat')
        assert.property(decoded, 'exp')
        assert.property(decoded, 'iss')
        done()
      })
    })
})
