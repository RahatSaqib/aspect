const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const assert = chai.assert

describe('Partner routes', () => {
  const path = '/api/partner'

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return a list of partners when using valid token', done => {
      server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 2)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'name')
          assert.property(res.body.data[0], 'partnerTypeId')
          assert.property(res.body.data[0], 'partnerTypeName')
          assert.property(res.body, 'total')
          done()
        })
    })
  })

  describe('POST', () => {})
})
