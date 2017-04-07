const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const assert = chai.assert

describe('Job routes', () => {
  const path = '/api/job-function/select-list'

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return a tree structure of partners and job functions', (done) => {
      server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 1)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'name')
          assert.typeOf(res.body.data[0].jobFunctions, 'array')
          done()
        })
    })
  })
})
