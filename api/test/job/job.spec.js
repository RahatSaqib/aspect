const chai = require('chai')
const shared = require('../utils/sharedToken')

const server = require('../utils/testUtils')

const { assert } = chai

describe('Job routes', () => {
  const path = '/api/job-function/select-list'
  before(() => {
    shared.checkToken(server, path)
  })

  describe('GET', () => {
    it('should return a tree structure of partners and job functions', done => {
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
