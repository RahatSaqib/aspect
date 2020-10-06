const chai = require('chai')
const { probesTooLow } = require('../../src/plugin/issueTriggers')
const { resultAnalyzeErrors } = require('../../src/result/actions')

const { assert } = chai

describe('This test is for testing different triggers conditions', () => {
  it('probesTooLow', async () => {
    assert.isTrue(probesTooLow(3, 100))
    assert.isTrue(probesTooLow(20, 200))
    assert.isFalse(probesTooLow(1, 100))
    assert.isFalse(probesTooLow(0, 0))
    assert.isFalse(probesTooLow(null, 0))
    assert.isFalse(probesTooLow(null, 100))
    assert.isFalse(probesTooLow(0, 2))
    assert.isFalse(probesTooLow(3, 200))
    assert.isFalse(probesTooLow(0, 100))
    assert.isFalse(probesTooLow(1, 1))
  })

  it('Should analyze different scenarios based on the data for triggering an action', () => {
    const analyzeProbesModule = resultAnalyzeErrors(1, 5007, {
      moduleName: 'Test1',
      moduleSerial: 'Module2',
    })
    const analyzeProbesTop = resultAnalyzeErrors(1, 5007, {
      consumableLot: 1234,
      assayId: 1,
    })
    assert.isObject(analyzeProbesModule)
    assert.property(analyzeProbesModule, 'type')
    assert.equal(analyzeProbesModule.type, 'RESULT_ANALYZE_PROBES_MODULE')
    assert.equal(analyzeProbesTop.type, 'RESULT_ANALYZE_PROBES_LOT')
  })
})
