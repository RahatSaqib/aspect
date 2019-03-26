const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Person routes', () => {
  describe('GET /person', () => {
    const path = '/api/person'
    shared.checkToken(server, path)

    it('should return a list of persons when using valid token', done => {
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
          assert.property(res.body.data[0], 'name')
          assert.property(res.body.data[0], 'level')
          assert.property(res.body.data[0], 'state')
          assert.property(res.body.data[0], 'lga')
          assert.property(res.body, 'total')
          done()
        })
    })
  })
})
