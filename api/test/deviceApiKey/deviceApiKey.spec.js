const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const assert = chai.assert

describe('Device routes', () => {
  const path = '/api/deviceApiKey'

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return a list of deviceApiKeys when using valid token', (done) => {
      server
      .get(path)
      .set('Authorization', `Bearer ${shared.token}`)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'array')
        assert.isAtLeast(res.body.data.length, 3)
        assert.property(res.body.data[0], 'id')
        assert.property(res.body.data[0], 'createdOn')
        assert.property(res.body.data[0], 'token')
        assert.property(res.body.data[0], 'partner')
        assert.property(res.body.data[0], 'country')
        assert.property(res.body.data[0], 'site')
        assert.property(res.body.data[0], 'device')
        assert.property(res.body.data[0], 'revoked')
        assert.property(res.body, 'total')
        done()
      })
    })
  })
})
