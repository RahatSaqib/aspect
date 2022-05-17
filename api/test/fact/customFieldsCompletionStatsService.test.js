const util = require('util')
const { expect } = require('chai')
// const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const {
  factFillCustomFieldsCompletionStats,
} = require('../../src/fact/customFieldsCompletionStatsService')

describe('CustomFieldsCompletionStatsService', async function () {
  this.timeout(0)
  it.skip('Must save stats data', async () => {
    const stats = await factFillCustomFieldsCompletionStats(
      '2021-05-01',
      '2021-05-30'
    )

    console.log('\x1b[1;34m', '🚀 Stats created: ', stats)
    expect(stats).to.be.an('Number')
  })
})
