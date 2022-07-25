const chai = require('chai')
const shared = require('../utils/sharedToken')

const server = require('../utils/testUtils')

const { assert } = chai

describe('Result Workflow Status Log', () => {
  const resultId = 1
  const path = `/api/result/workflow-status-logs/${resultId}`

  before(() => {
    shared.checkToken(server, path)
  })

  describe('GET', () => {
    // TODO: Fails only eventually in Bamboo, works locally
    it.skip('should return a list of Result Workflow Status Logs (when using valid token)', async () => {
      const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isAtLeast(res.body.data.length, 1)
      assert.property(res.body.data[0], 'id')
      assert.property(res.body.data[0], 'changedOn')
      assert.property(res.body.data[0], 'statusName')
      assert.property(res.body.data[0], 'operator')
      assert.property(res.body, 'total')
    })
  })
})
