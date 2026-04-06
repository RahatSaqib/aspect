const chai = require('chai')
const shared = require('../utils/sharedToken')
const { createTestContext } = require('../deviceApi/utils')
const { knex } = require('../../src/db')

// This agent refers to PORT where program is runninng.
const server = require('../utils/testUtils')

const { assert } = chai

const context = createTestContext(knex, server, {
  user: 'admin',
  type: 'DaktariVirology',
  partner: 'Partner One',
})

describe('Tag routes', () => {
  const path = '/api/tag'

  before(() => {
    shared.checkToken(server, `${path}/result`)
  })

  describe('GET', () => {
    beforeEach(async () => {
      await context.createDeviceWithResult({})
      const { deviceId } = context
      const { id: resultId } = await knex('Result as r').where({ deviceId }).first('id')
      const res = await server
        .put(`${path}/result/${resultId}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .send({ tags: `TestTag-${resultId}` })

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.property(res.body.data[0], 'id')
      assert.property(res.body.data[0], 'title')
      assert.property(res.body.data[0], 'partnerId')
    })

    afterEach(async () => {
      await context.afterEach()
    })
    it('should return a list of tags when using valid token', async () => {
      const res = await server.get(`${path}/result`).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.property(res.body.data[0], 'id')
      assert.property(res.body.data[0], 'title')
      assert.property(res.body.data[0], 'partnerId')
    })
  })
})
