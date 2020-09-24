const chai = require('chai')
const { probesTooLow } = require('../../src/plugin/issueTriggers')

const { assert } = chai

describe('This test is for testing different triggers conditions', () => {
  it('probesTooLow', async () => {
    assert.isTrue(probesTooLow(3, 100))
    assert.isTrue(probesTooLow(20, 200))
    assert.isFalse(probesTooLow(1, 100))
    assert.isFalse(probesTooLow(0, 0))
    assert.isFalse(probesTooLow(0, 2))
    assert.isFalse(probesTooLow(3, 200))
    assert.isFalse(probesTooLow(0, 100))
  })
})
