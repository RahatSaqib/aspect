const chai = require('chai')
const {
  analyzeResultsWithErrors,
  hasUnusedModules,
} = require('../../src/plugin/issueTriggers')
const { resultAnalyzeCategoriesAndErrors } = require('../../src/result/actions')

const { assert } = chai

describe('This test is for testing different triggers conditions', () => {
  it('hasUnusedModules', async () => {
    // numberOfResults, numberOfModules, minResults, expectedUsedModules
    assert.isFalse(hasUnusedModules(10, 2, 20, 4))
    assert.isTrue(hasUnusedModules(10, 2, 9, 4))
    assert.isFalse(hasUnusedModules(10, 3, 9, 3))
    assert.isFalse(hasUnusedModules(20, 4, 20, 4))
    assert.isTrue(hasUnusedModules(20, 1, 20, 4))
    assert.isFalse(hasUnusedModules(0, 2, null, null))
    assert.isFalse(hasUnusedModules(0, 0, 20, 4))
    chai
      .expect(() => hasUnusedModules(null, undefined, 20, 4))
      .to.throw(
        "numberOfResults and numberOfModules can't be null or undefined"
      )
  })

  it('analyzeResultsWithErrors', async () => {
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

  it('Should analyze different scenarios based on the data for triggering an action resultAnalyzeErrors', () => {
    ;[
      {
        errorCode: 2005,
        type1: 'RESULT_ANALYZE_SYRINGE_STALL_ERROR',
      },
      {
        errorCode: 2008,
        type1: 'RESULT_ANALYZE_SYRINGE_PRESSURE_TOO_HIGH',
      },
      {
        errorCode: 2035,
        type1: 'RESULT_ANALYZE_ULTRASONIC_HORN_FAILURE',
      },
      {
        errorCode: 2037,
        type1: 'RESULT_ANALYZE_CARTRIDGE_INTEGRITY_TEST_FAILURE',
      },
      {
        errorCode: 2026,
        type1: 'RESULT_ANALYZE_ULTRASONIC_HORN_CURRENT_OUT_RANGE',
      },
      {
        errorCode: 2096,
        type1: 'RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_ERROR',
      },
      {
        errorCode: 2097,
        type1: 'RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION',
      },
      {
        errorCode: 5011,
        type1: 'RESULT_ANALYZE_SIGNAL_LOSS_AMP_CURVE',
      },
      {
        errorCode: 5006,
        type1: 'RESULT_ANALYZE_PROBES_HIGH',
      },
      {
        errorCode: 5007,
        type1: 'RESULT_ANALYZE_PROBES_FAILED',
      },
      {
        errorCode: 5017,
        type1: 'RESULT_ANALYZE_PROBES_FAILED',
      },
      {
        errorCode: 5016,
        type1: 'RESULT_ANALYZE_INVALIDS',
      },
      {
        // on non existing code it should return default values
        errorCode: 5555,
        type1: 'RESULT_ANALYZE_PROBES',
      },
    ].forEach(elem => {
      const analyzeProbes = resultAnalyzeCategoriesAndErrors(
        1,
        1,
        'DETECTED',
        elem.errorCode,
        {
          moduleName: 'Test1',
          moduleSerial: 'Module2',
        }
      )
      assert.isObject(analyzeProbes)
      assert.property(analyzeProbes, 'type')
      assert.equal(analyzeProbes.type, elem.type1)
    })
  })
  it('Should analyze different scenarios based on the data for triggering an action', () => {
    ;[
      {
        resultCategoryId: 'Invalid',
        errorCode: 5002,
        type1: 'RESULT_ANALYZE_INVALIDS',
      },
      {
        resultCategoryId: 'Non-existing',
        type1: 'RESULT_ANALYZE_PROBES',
      },
    ].forEach(elem => {
      const analyzeProbesModule = resultAnalyzeCategoriesAndErrors(
        1,
        1,
        elem.resultCategoryId,
        elem.errorCode,
        {
          moduleName: 'Test1',
          moduleSerial: 'Module2',
        }
      )
      assert.isObject(analyzeProbesModule)
      assert.property(analyzeProbesModule, 'type')
      assert.equal(analyzeProbesModule.type, elem.type1)
    })
  })
})
