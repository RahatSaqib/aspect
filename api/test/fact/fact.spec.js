const chai = require('chai')
const supertest = require('supertest')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const { createTestContext } = require('../deviceApi/utils')
const { waitForIdle } = require('../utils/mqUtils')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

const devicePostResultPath = '/device/result'
const context = createTestContext(server, {
  user: 'admin',
  type: 'DaktariVirology',
  partner: 'Partner One',
})

describe('Fact tables initial data', () => {
  beforeEach(async () => {
    await context.createDeviceWithResult()
    const { now, deviceAuth } = context
    await server
      .post(devicePostResultPath)
      .set('Authorization', deviceAuth)
      .send({
        data: { a: 'b' },
        assay: { id: 'DaktariHivVl' },
        startedOn: now,
        endedOn: new Date(),
      })
      .then(res => {
        assert.equal(res.status, 200)
      })
    await waitForIdle()
  })
  afterEach(context.afterEach)

  describe('result counts', () => {
    it('should contain result counts that agree with the results in the Result-table', () =>
      runTestWithKnex(async knex => {
        // get result counts for first device in Result-table
        const [countInResultTable] = await knex('Result')
          .where({ deviceId: context.deviceId })
          .count('id as resultCount')

        // get result counts in fact tables
        const [countInFactTable] = await knex('FactResultsDevice')
          .where({ deviceId: context.deviceId })
          .andWhere({ days: 9999 })
          .select('resultCount')

        // same?
        assert.equal(
          countInResultTable.resultCount,
          countInFactTable.resultCount
        )
      }))
  })
})
