const chai = require('chai')
const assert = chai.assert
const jwt = require('jsonwebtoken')
const config = require('../../src/config')
const sharedToken = require('../utils/sharedToken')

const shared = module.exports = {
  checkDeviceToken(server, path, deviceId, opts) {
    opts = opts || {}
    const method = (opts.method || 'get').toLowerCase()

    it('should return 401 and error message when trying to get without access token', function(done) {
      server
        [method](path)
        .end(function(err, res) {
          assert.equal(res.status, 401)
          assert.isString(res.body.message)
          assert.notEqual(res.body.message, '')
          done()
        })
    })

    it('should return 401 and error message when using invalid token', function(done) {
      server
        [method](path)
        .set('Authorization', 'MOARTOKENZ')
        .end(function(err, res) {
          assert.equal(res.status, 401)
          assert.isString(res.body.message)
          assert.notEqual(res.body.message, '')
          done()
        })
    })

    it('should return 401 and error message when using client token', function(done) {
      server
        [method](path)
        .set('Authorization', sharedToken.token)
        .end(function(err, res) {
          assert.equal(res.status, 401)
          assert.isString(res.body.message)
          assert.notEqual(res.body.message, '')
          done()
        })
    })
  },

  authenticateUserAndFirstDevice(server, {user, password, type}){
    sharedToken.authenticateUser(server, user, password)

    it(`should authenticate first device for user ${user}`, function(done) {
      server
        .get('/api/device?size=1'+(type ? '&type='+type : ''))
        .set('Authorization', 'Bearer '+sharedToken.token)
        .end(function(err,res){
          assert.equal(res.status, 200)

          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.equal(res.body.data.length, 1)
          assert.property(res.body.data[0], 'id')

          // save device id for the following tests
          const deviceId = res.body.data[0].id

          server
            .get(`/api/device/${deviceId}/api-key`)
            .set('Authorization', 'Bearer '+sharedToken.token)
            .end(function(err,res){
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

  // use this in your tests to get a valid device token for testing
  deviceToken: '',

  // Authenticated deviceId
  deviceId: -1
}
