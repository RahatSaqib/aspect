const chai = require('chai')
const shared = require('../utils/sharedToken')

const server = require('../utils/testUtils')

const { assert } = chai

describe('Partner routes', () => {
  const path = '/api/partner'
  before(() => {
    shared.checkToken(server, path)
  })
  describe('GET', () => {
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
