const chai = require('chai')
const _ = require('lodash')
const jwt = require('jsonwebtoken')
const config = require('../../src/config')
const sharedToken = require('../utils/sharedToken')
const { run } = require('../../src/db')
const { deleteTestDataFromCheckpoint } = require('./utils')

const assert = chai.assert
const devicePath = '/device'

const shared = module.exports = {
  checkDeviceToken(server, path, deviceId, opts) {
    opts = opts || {}
    const method = (opts.method || 'get').toLowerCase()

    it('should return 401 and error message when trying to get without access token', (done) => {
      server[method](path)
        .end((err, res) => {
          assert.equal(res.status, 401)
          assert.isString(res.body.message)
          assert.notEqual(res.body.message, '')
          done()
        })
    })

    it('should return 401 and error message when using invalid token', (done) => {
      server[method](path)
        .set('Authorization', 'MOARTOKENZ')
        .end((err, res) => {
          assert.equal(res.status, 401)
          assert.isString(res.body.message)
          assert.notEqual(res.body.message, '')
          done()
        })
    })

    it('should return 401 and error message when using client token', (done) => {
      server[method](path)
        .set('Authorization', sharedToken.token)
        .end((err, res) => {
          assert.equal(res.status, 401)
          assert.isString(res.body.message)
          assert.notEqual(res.body.message, '')
          done()
        })
    })
  },

  authenticateUserAndFirstDevice(server, { user, password, type }) {
    sharedToken.authenticateUser(server, user, password)

    it(`should authenticate first device for user ${user}`, (done) => {
      server
        .get(`/api/device?size=1${type ? `&type=${type}` : ''}`)
        .set('Authorization', `Bearer ${sharedToken.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)

          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.equal(res.body.data.length, 1)
          assert.property(res.body.data[0], 'id')

          // save device id for the following tests
          const deviceId = res.body.data[0].id

          server
            .get(`/api/device/${deviceId}/api-key`)
            .set('Authorization', `Bearer ${sharedToken.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.isAbove(res.body.access.length, 1)

              // save token for the following tests:
              shared.deviceId = deviceId
              shared.deviceToken = res.body.access
              jwt.verify(sharedToken.token, config.secret, done)
            })
        })
    })
  },

  getApiKey(server, deviceId) {
    return server
      .get(`/api/device/${deviceId}/api-key`)
      .set('Authorization', `Bearer ${sharedToken.token}`)
      .then((res) => {
        assert.equal(res.status, 200)
        assert.isAbove(res.body.access.length, 1)
        return res.body.access
      })
  },

  createTestContext(server) {
    return new DeviceApiTestContext(server)
  },

  // use this in your tests to get a valid device token for testing
  deviceToken: '',

  // Authenticated deviceId
  deviceId: -1
}

class DeviceApiTestContext {
  constructor(server) {
    this.server = server
    this.checkpoint = null
    this.deviceIds = []

    _.bindAll(this, ['beforeEach', 'afterEach', 'runTest'])
  }

  beforeEach() {
    const self = this
    return run(function* () {
      self.checkpoint = null
      self.deviceIds.splice(0)
    })
  }

  // Does not currently work to create initial checkpoint in beforeEach
  // because of how Device Token is setup, so runTest creates an initial
  // checkpoint and then runs test using db.run
  runTest(test) {
    const self = this
    return run(function* (knex) {
      const { deviceId, deviceToken } = shared
      self.deviceIds.splice(0)
      self.deviceIds.push(deviceId)

      const deviceAuth = `Bearer ${deviceToken}`

      self.checkpoint = `Device API Device Tests ${new Date()}`
      yield self.server.post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ checkpoint: self.checkpoint })
        .then((res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

      return yield* test(knex)
    })
  }

  afterEach() {
    const self = this
    return run(function* (knex) {
      if (self.checkpoint) {
        yield* deleteTestDataFromCheckpoint(knex, self.checkpoint, self.deviceIds)
      }
    })
  }
}
