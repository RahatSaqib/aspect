const chai = require('chai')

const assert = chai.assert

module.exports = {
  // this can be reused in tests for all routes that require authentication
  checkToken(server, path) {
    it('should return 401 and error message when trying to get without access token', done => {
      server.get(path).end((err, res) => {
        assert.equal(res.status, 401)
        assert.isString(res.body.message)
        assert.notEqual(res.body.message, '')
        // assert.equal(res.body.message, 'No token provided')
        done()
      })
    })

    it('should return 401 and error message when using invalid token', done => {
      server
        .get(path)
        .set('Authorization', 'Bearer MOARTOKENZ')
        .end((err, res) => {
          assert.equal(res.status, 401)
          assert.isString(res.body.message)
          assert.notEqual(res.body.message, '')
          // assert.equal(res.body.message, 'Failed to authenticate token')
          done()
        })
    })

    it('should return 401 and error message when using outdated token', done => {
      server
        .get(path)
        .set(
          'Authorization',
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoic2JhdW1nYXJ0bmVyIiwibW9kdWxlcyI6WyJpbnYiLCJtYWkiXSwicm9sZXMiOlsiYWRtaW4iXSwiaWF0IjoxNDYyOTgyNTAyLCJleHAiOjE0NjI5ODYxMDIsImlzcyI6Imh0dHBzOi8vd3d3LmFzcGVjdC5pZCJ9.MhKor2PE9FLeEHdCh3GgsddOt_toq_ZcDdaRXMURTkc'
        )
        .end((err, res) => {
          assert.equal(res.status, 401)
          assert.isString(res.body.message)
          assert.notEqual(res.body.message, '')
          // assert.equal(res.body.message, 'Failed to authenticate token')
          done()
        })
    })
  },

  // use this in your tests to get a valid client token for testing
  token: '',
}
