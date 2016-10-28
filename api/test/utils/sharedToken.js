const chai = require('chai')
const assert = chai.assert
const jwt = require('jsonwebtoken')
const config = require('../../src/config')

const shared = module.exports = {

  // this can be reused in tests for all routes that require authentication
  checkToken(server, path) {
    it('should return 401 and error message when trying to get without access token', function(done) {
      server
        .get(path)
        .end(function(err, res) {
          assert.equal(res.status, 401)
          assert.isString(res.body.message)
          assert.notEqual(res.body.message, '')
          //assert.equal(res.body.message, 'No token provided')
          done()
        })
    })

    it('should return 401 and error message when using invalid token', function(done) {
      server
        .get(path)
        .set('Authorization', 'Bearer MOARTOKENZ')
        .end(function(err, res) {
          assert.equal(res.status, 401)
          assert.isString(res.body.message)
          assert.notEqual(res.body.message, '')
          //assert.equal(res.body.message, 'Failed to authenticate token')
          done()
        })
    })

    it('should return 401 and error message when using outdated token', function(done) {
      server
        .get(path)
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoic2JhdW1nYXJ0bmVyIiwibW9kdWxlcyI6WyJpbnYiLCJtYWkiXSwicm9sZXMiOlsiYWRtaW4iXSwiaWF0IjoxNDYyOTgyNTAyLCJleHAiOjE0NjI5ODYxMDIsImlzcyI6Imh0dHBzOi8vd3d3LmFzcGVjdC5pZCJ9.MhKor2PE9FLeEHdCh3GgsddOt_toq_ZcDdaRXMURTkc')
        .end(function(err, res) {
          assert.equal(res.status, 401)
          assert.isString(res.body.message)
          assert.notEqual(res.body.message, '')
          //assert.equal(res.body.message, 'Failed to authenticate token')
          done()
        })
    })
  },

  authenticateUser(server, username, password='test07'){
    it(`should authenticate user ${username} and return valid JWT token`, function(done) {
      server
      .post('/api/auth')
      .send({ name: username, password, clientName: 'Mocha/Chai' })
      .end(function(err,res){
        assert.equal(res.status, 200)
        assert.isAbove(res.body.access.length, 100)
        assert.isAbove(res.body.refresh.length, 50)
        assert.isAbove(res.body.clientId.length, 32)

        // save token for the following tests:
        shared.token = res.body.access
        jwt.verify(shared.token, config.secret, done)
      })
    })
  },

  // use this in your tests to get a valid client token for testing
  token: ''
}
