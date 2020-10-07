const chai = require('chai')
const { analyzeResultsWithErrors } = require('../../src/plugin/issueTriggers')
const { resultAnalyzeErrors } = require('../../src/result/actions')

const { assert } = chai

describe('This test is for testing different triggers conditions', () => {
  it('probesTooLow', async () => {
    assert.isTrue(analyzeResultsWithErrors(3, 100, 0.03, false, 3))
    assert.isTrue(analyzeResultsWithErrors(20, 200, 0.1, false, 3))
    assert.isTrue(analyzeResultsWithErrors(1, 100, 0.03, true, 1))
    assert.isFalse(analyzeResultsWithErrors(1, 100, 0.03, false, 3))
    assert.isFalse(analyzeResultsWithErrors(0, 0, 0.03, false, 3))
    assert.isFalse(analyzeResultsWithErrors(null, 0, 0.03, false, 3))
    assert.isFalse(analyzeResultsWithErrors(null, 100, 0.03, false, 3))
    assert.isFalse(analyzeResultsWithErrors(0, 2, 0.03, false, 3))
    assert.isFalse(analyzeResultsWithErrors(3, 200, 0.03, false, 3))
    assert.isFalse(analyzeResultsWithErrors(0, 100, 0.03, false, 3))
    assert.isFalse(analyzeResultsWithErrors(1, 1, 0.03, false, 3))
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
