let chai = require('chai')
let assert = chai.assert

module.exports = {

  // this can be reused in tests for all routes that require authentication
  checkToken: function(server, path) {
    it('should return 403 and error message when trying to get without access token', function(done) {
      server
        .get(path)
        .end(function(err, res) {
          assert.equal(res.status, 403)
          assert.isString(res.body.message)
          assert.notEqual(res.body.message, '')
          //assert.equal(res.body.message, 'No token provided')
          done()
        })
    })

    it('should return 401 and error message when using invalid token', function(done) {
      server
        .get(path)
        .set('x-access-token', 'MOARTOKENZ')
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
        .set('x-access-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoic2JhdW1nYXJ0bmVyIiwibW9kdWxlcyI6WyJpbnYiLCJtYWkiXSwicm9sZXMiOlsiYWRtaW4iXSwiaWF0IjoxNDYyOTgyNTAyLCJleHAiOjE0NjI5ODYxMDIsImlzcyI6Imh0dHBzOi8vd3d3LmFzcGVjdC5pZCJ9.MhKor2PE9FLeEHdCh3GgsddOt_toq_ZcDdaRXMURTkc')
        .end(function(err, res) {
          assert.equal(res.status, 401)
          assert.isString(res.body.message)
          assert.notEqual(res.body.message, '')
          //assert.equal(res.body.message, 'Failed to authenticate token')
          done()
        })
    })
  },

  // use this in your tests to get a valid token for testing
  token: ''

}
