const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Result type routes', () => {
  const path = '/api/result/result-types'

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return a list of result types when using valid token', done => {
      server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 5)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'name')
          assert.property(res.body, 'total')
          done()
        })
    })
  })
})
