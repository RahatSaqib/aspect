const util = require('util')
const { expect } = require('chai')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const {
  customFieldsCompletionStatsService,
} = require('../../src/fact/customFieldsCompletionStatsService')

describe('CustomFieldsCompletionStatsService', async () => {
  it.only('Must retrieve custom fields', async () => {
    const stats = await customFieldsCompletionStatsService(
      '2022-02-01',
      '2022-03-01'
    )

    console.log('\x1b[1;34m', '🚀  ➜', stats[2])
    expect(stats).to.be.an('Array')
  })
})
