const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Tag routes', () => {
  describe('GET', () => {
    const path = '/api/tag'
    shared.checkToken(server, `${path}/result`)

    it('should return a list of tags when using valid token', done => {
      server
        .get(`${path}/result`)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'title')
          assert.property(res.body.data[0], 'partnerId')
          done()
        })
    })
  })
})
