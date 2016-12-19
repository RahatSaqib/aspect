const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
const sharedDevice = require('../deviceApi/deviceToken')
const { getLastResultId } = require('../deviceApi/utils')

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const assert = chai.assert
const context = sharedDevice.createTestContext(server)


describe('Demo Device routes', () => {
  const path = '/api/demo/device'

  sharedDevice.authenticateUserAndFirstDevice(server, { user: 'admin', type: 'GeneXpert' })

  const runTest = context.runTest

  beforeEach(context.beforeEach)
  afterEach(context.afterEach)

  it('should return a list of assays and post result', () => runTest(function* (knex) {
    const { deviceId } = sharedDevice

    const firstResultId = yield* getLastResultId(knex, deviceId)

    let resultId = null
    yield server
      .get(`${path}/${deviceId}`)
      .set('Authorization', `Bearer ${shared.token}`)
      .then((res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'id')
        assert.equal(res.body.id, `${deviceId}`)
        assert.property(res.body, 'access')
        assert.property(res.body, 'assays')

        const { assays } = res.body
        assert.typeOf(assays, 'array')
        assert.isAtLeast(assays.length, 1)

        const [assay] = assays
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

    yield server
      .post(`${path}/${deviceId}/result`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({ resultId })
      .then((res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
      })

    const lastResultId = yield* getLastResultId(knex, deviceId)
    assert.isNotNull(resultId)
    assert.notEqual(resultId, lastResultId)
    assert.notEqual(resultId, firstResultId)
    assert.notEqual(lastResultId, firstResultId)
  }))
})
