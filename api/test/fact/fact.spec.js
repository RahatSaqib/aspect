const chai = require('chai')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const { createTestContext } = require('../deviceApi/utils')
const { waitForIdle } = require('../utils/mqUtils')
const { knex } = require('../../src/db')
const server = require('../utils/testUtils')

const { assert } = chai

const devicePath = '/device'
const context = createTestContext(knex, server, {
  user: 'admin',
  type: 'DaktariVirology',
  partner: 'Partner One',
})

describe('Fact tables initial data', () => {
  beforeEach(async () => {
    await context.createDeviceWithResult()
    const { now, deviceAuth } = context
    await server
      .post(devicePath)
      .set('Authorization', deviceAuth)
      .send({
        result: {
          data: { a: 'b' },
          assay: { id: 'DaktariHivVL' },
          startedOn: now,
          endedOn: new Date(),
        },
      })
      .then(res => {
        assert.equal(res.status, 200)
      })
    await waitForIdle(1000)
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
        assert.equal(countInResultTable.resultCount, countInFactTable.resultCount)
      }))
  })
})
