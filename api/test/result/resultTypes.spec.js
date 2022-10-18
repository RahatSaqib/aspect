const chai = require('chai')
const shared = require('../utils/sharedToken')

const server = require('../utils/testUtils')

const { assert } = chai

describe('Result type routes', () => {
  const path = '/api/result/result-types'
  before(() => {
    shared.checkToken(server, path)
  })
  describe('GET', () => {
    it('should return a list of result types when using valid token', async () => {
      const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isAtLeast(res.body.data.length, 5)
      assert.property(res.body.data[0], 'id')
      assert.property(res.body.data[0], 'name')
      assert.property(res.body, 'total')
    })
  })
})
