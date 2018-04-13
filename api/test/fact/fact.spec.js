const chai = require('chai')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const { assert } = chai

describe('Fact tables initial data', () => {
  describe('result counts', () => {
    it.skip('should contain result counts that agree with the results in the Result-table', () =>
      runTestWithKnex(async knex => {
        // get result counts for first device in Result-table
        const [minDevice] = await knex('Result').min('deviceId as deviceId')
        const [countInResultTable] = await knex('Result')
          .where({ deviceId: minDevice.deviceId })
          .count('id as resultCount')

        // get result counts in fact tables
        const [countInFactTable] = await knex('FactResultCountDevice')
          .where({ deviceId: minDevice.deviceId })
          .andWhere('days', null)
          .andWhere('resultCategory1', null)
          .andWhere('assayId', null)
          .select('resultCount')

        // same?
        assert.equal(
          countInResultTable.resultCount,
          countInFactTable.resultCount
        )
      }))
  })
})
