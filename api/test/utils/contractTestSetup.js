require('dotenv-safe').load()

const supertest = require('supertest')
const jwt = require('jsonwebtoken')
const chai = require('chai')
const shared = require('./sharedToken')
const config = require('../../src/config')

const serverUrl = 'http://localhost:8080'
const server = supertest.agent(serverUrl)
let attemptsToConnect = 0
const { assert } = chai
chai.should()
chai.use(require('chai-subset'))

function attemptToConnectAndLogin(done) {
  if (attemptsToConnect === 3) {
    done()
  }
  setTimeout(() => {
    server.get('/').end((err, res) => {
      if (err || !res || res.status !== 200) {
        attemptsToConnect += 1
        attemptToConnectAndLogin(done)
      } else {
        tryLogin(done)
      }
    })
  }, 1000)
}

function tryLogin(done) {
  server
    .post('/api/auth')
    .send({ name: 'admin', password: 'test07', clientName: 'Mocha/Chai' })
    .end((err, res) => {
      assert.equal(res.status, 200)
      assert.isAbove(res.body.access.length, 100)
      assert.isAbove(res.body.refresh.length, 50)
      assert.isAbove(res.body.clientId.length, 32)
      shared.token = res.body.access
      jwt.verify(res.body.access, config.secret, (err, decoded) => {
        assert.isNotOk(err)
        assert.property(decoded, 'name')
        assert.property(decoded, 'permissions')
        assert.property(decoded, 'iat')
        assert.property(decoded, 'exp')
        assert.property(decoded, 'iss')
        tryRefreshToken(res.body.refresh, res.body.clientId, done)
      })
    })
}

function tryRefreshToken(refreshToken, clientId, done) {
  server
    .post('/api/auth/refresh')
    .send({ clientId, token: refreshToken })
    .end((err, res) => {
      assert.equal(res.status, 200)
      assert.isAbove(res.body.access.length, 100)
      assert.isAbove(res.body.refresh.length, 50)
      assert.isAbove(res.body.clientId.length, 32)
      shared.token = res.body.access
      jwt.verify(res.body.access, config.secret, (err, decoded) => {
        assert.isNotOk(err)
        assert.property(decoded, 'name')
        assert.property(decoded, 'permissions')
        assert.property(decoded, 'iat')
        assert.property(decoded, 'exp')
        assert.property(decoded, 'iss')
        done()
      })
    })
}

before(done => {
  // Wait until server is up and running
  attemptToConnectAndLogin(done)
})
