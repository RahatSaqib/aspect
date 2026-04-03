const chai = require('chai')

const { assert } = chai

module.exports = {
  async ensureToken(server, opts = {}) {
    if (this.token) {
      return this.token
    }

    const {
      name = 'admin',
      password = 'test07',
      clientName = 'test-suite',
      clientId = `test-suite-${Date.now()}`,
    } = opts

    const res = await server.post('/api/auth').send({
      name,
      password,
      clientName,
      clientId,
    })

    assert.equal(res.status, 200)
    assert.isString(res.body.access)
    assert.notEqual(res.body.access, '')

    this.token = res.body.access
    return this.token
  },

  checkToken(server, path) {
    describe(`Shared - Check token on "${path}"`, () => {
      it('should return 401 and error message when trying to get without access token', async () => {
        const res = await server.get(path).unset('Authorization')
        assert.equal(res.status, 401)
        assert.isString(res.body.message)
        assert.notEqual(res.body.message, '')
      })

      it('should return 401 and error message when using invalid token', async () => {
        const res = await server.get(path).set('Authorization', 'Bearer MOARTOKENZ')

        assert.equal(res.status, 401)
        assert.isString(res.body.message)
        assert.notEqual(res.body.message, '')
      })

      it('should return 401 and error message when using outdated token', async () => {
        const res = await server
          .get(path)
          .set(
            'Authorization',
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoic2JhdW1nYXJ0bmVyIiwibW9kdWxlcyI6WyJpbnYiLCJtYWkiXSwicm9sZXMiOlsiYWRtaW4iXSwiaWF0IjoxNDYyOTgyNTAyLCJleHAiOjE0NjI5ODYxMDIsImlzcyI6Imh0dHBzOi8vd3d3LmFzcGVjdC5pZCJ9.MhKor2PE9FLeEHdCh3GgsddOt_toq_ZcDdaRXMURTkc'
          )

        assert.equal(res.status, 401)
        assert.isString(res.body.message)
        assert.notEqual(res.body.message, '')
      })
    })
  },

  // use this in your tests to get a valid client token for testing
  token: '',
}
