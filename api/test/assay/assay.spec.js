const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const assert = chai.assert

describe('Assay routes', () => {
  const path = '/api/assay'

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return a list of assays when using valid token', done => {
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
          assert.property(res.body.data[0], 'assayTypeId')
          assert.property(res.body.data[0], 'deviceTypeId')
          assert.property(res.body.data[0], 'name')
          assert.property(res.body.data[0], 'assayTypeName')
          assert.property(res.body.data[0], 'deviceTypeName')
          assert.property(res.body.data[0], 'hasResults')
          assert.property(res.body.data[0], 'resultDataSchema')
          assert.property(res.body, 'total')
          done()
        })
    })
  })
})
