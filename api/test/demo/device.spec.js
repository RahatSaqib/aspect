const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const { createTestContext, getLastResultId } = require('../deviceApi/utils')

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const { assert } = chai
const context = createTestContext(server, { user: 'admin', type: 'GeneXpert' })

describe('Demo Device routes', () => {
  const path = '/api/demo/device'

  const { runTest } = context

  beforeEach(context.beforeEach)
  afterEach(context.afterEach)

  it('should return a list of assays and post result', () =>
    runTest(async knex => {
      const { deviceId, clientAuth } = context

      const firstResultId = await getLastResultId(knex, deviceId)

      let resultId = null
      await server
        .get(`${path}/${deviceId}`)
        .set('Authorization', clientAuth)
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'id')
          assert.equal(res.body.id, `${deviceId}`)
          assert.property(res.body, 'access')
          assert.property(res.body, 'assays')

          const { assays } = res.body
          assert.typeOf(assays, 'array')
          assert.isAtLeast(assays.length, 1)

          const assay = _.find(assays, { name: 'GeneXpert MTB/Rif' })
          assert.typeOf(assay, 'Object')
          assert.property(assay, 'id')
          assert.property(assay, 'name')
          assert.property(assay, 'results')

          const { results } = assay
          assert.typeOf(results, 'array')
          assert.isAtLeast(results.length, 1)

          const [result] = results
          assert.property(result, 'id')
          assert.property(result, 'name')
          resultId = result.id
        })

      await server
        .post(`${path}/${deviceId}/result`)
        .set('Authorization', clientAuth)
        .send({ resultId })
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })

      const lastResultId = await getLastResultId(knex, deviceId)
      assert.isNotNull(resultId)
      assert.notEqual(resultId, lastResultId)
      assert.notEqual(resultId, firstResultId)
      assert.notEqual(lastResultId, firstResultId)
    }))
})
