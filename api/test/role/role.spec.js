const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const assert = chai.assert

describe('Role routes', () => {
  const path = '/api/role/select-list'

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return a tree structure of partners, organisational units and roles', (done) => {
      server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 2)
          assert.isUndefined(res.body.data[0].id)
          assert.isUndefined(res.body.data[0].name)
          assert.typeOf(res.body.data[0].orgUnits, 'array')
          assert.equal(res.body.data[0].orgUnits.length, 1)
          assert.isUndefined(res.body.data[0].orgUnits[0].id)
          assert.isUndefined(res.body.data[0].orgUnits[0].name)
          assert.typeOf(res.body.data[0].orgUnits[0].roles, 'array')

          assert.property(res.body.data[1], 'id')
          assert.property(res.body.data[1], 'name')
          assert.typeOf(res.body.data[1].orgUnits, 'array')

          assert.isAtLeast(res.body.data[1].orgUnits.length, 1)
          assert.isUndefined(res.body.data[1].orgUnits[0].id)
          assert.isUndefined(res.body.data[1].orgUnits[0].name)
          assert.typeOf(res.body.data[1].orgUnits[0].roles, 'array')
          done()
        })
    })
  })
})
