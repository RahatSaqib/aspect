const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
const { createTestContext } = require('../deviceApi/utils')
const { run } = require('../../src/db')

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const { assert } = chai

const context = createTestContext(server, {
  user: 'admin',
  type: 'DaktariVirology',
  partner: 'Partner One',
})

describe('Tag routes', () => {
  describe('GET', () => {
    const path = '/api/tag'
    shared.checkToken(server, `${path}/result`)

    before(async () => {
      await context.createDeviceWithResult()
      const { deviceId } = context
      return run(async knex => {
        const { id: resultId } = await knex('Result as r')
          .where({ deviceId })
          .first('id')
        await server
          .put(`${path}/result/${resultId}`)
          .set('Authorization', `Bearer ${shared.token}`)
          .send({ tags: `TestTag-${resultId}` })
          .then(res => {
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

    after(async () => {
      await context.afterEach()
    })

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
