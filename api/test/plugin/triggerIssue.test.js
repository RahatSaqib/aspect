const chai = require('chai')
const { analyzeResultsWithErrors, hasUnusedModules } = require('../../src/plugin/issueTriggers')
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
      .to.throw("numberOfResults and numberOfModules can't be null or undefined")
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
        type1: 'RESULT_ANALYZE_SYRINGE_STALL_ERROR_MODULE',
        type2: 'RESULT_ANALYZE_SYRINGE_STALL_ERROR_LOT',
      },
      {
        errorCode: 2008,
        type1: 'RESULT_ANALYZE_SYRINGE_PRESSURE_TOO_HIGH_MODULE',
        type2: 'RESULT_ANALYZE_SYRINGE_PRESSURE_TOO_HIGH_LOT',
      },
      {
        errorCode: 2035,
        type1: 'RESULT_ANALYZE_ULTRASONIC_HORN_FAILURE_MODULE',
        type2: 'RESULT_ANALYZE_ULTRASONIC_HORN_FAILURE_LOT',
      },
      {
        errorCode: 2037,
        type1: 'RESULT_ANALYZE_CARTRIDGE_INTEGRITY_TEST_FAILURE_MODULE',
        type2: 'RESULT_ANALYZE_CARTRIDGE_INTEGRITY_TEST_FAILURE_LOT',
      },
      {
        errorCode: 2026,
        type1: 'RESULT_ANALYZE_ULTRASONIC_HORN_CURRENT_OUT_RANGE_MODULE',
        type2: 'RESULT_ANALYZE_ULTRASONIC_HORN_CURRENT_OUT_RANGE_LOT',
      },
      {
        errorCode: 2096,
        type1: 'RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_ERROR_MODULE',
        type2: 'RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_ERROR_LOT',
      },
      {
        errorCode: 2097,
        type1: 'RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_MODULE',
        type2: 'RESULT_ANALYZE_ASSAY_SPECIFIC_TERMINATION_LOT',
      },

      {
        errorCode: 5007,
        type1: 'RESULT_ANALYZE_PROBES_FAILED_MODULE',
        type2: 'RESULT_ANALYZE_PROBES_FAILED_LOT',
      },
      {
        errorCode: 5011,
        type1: 'RESULT_ANALYZE_SIGNAL_LOSS_AMP_CURVE_MODULE',
        type2: 'RESULT_ANALYZE_SIGNAL_LOSS_AMP_CURVE_LOT',
      },
      {
        errorCode: 5006,
        type1: 'RESULT_ANALYZE_PROBES_HIGH_MODULE',
        type2: 'RESULT_ANALYZE_PROBES_HIGH_LOT',
      },
      {
        errorCode: 5017,
        type1: 'RESULT_ANALYZE_PROBES_FAILED_MODULE',
        type2: 'RESULT_ANALYZE_PROBES_FAILED_LOT',
      },
      {
        errorCode: 5016,
        type1: 'RESULT_ANALYZE_INVALIDS_MODULE',
        type2: 'RESULT_ANALYZE_INVALIDS_LOT',
      },
      {
        // on non existing code it should return default values
        errorCode: 5555,
        type1: 'RESULT_ANALYZE_PROBES_MODULE',
        type2: 'RESULT_ANALYZE_PROBES_LOT',
      },
    ].forEach(elem => {
      const analyzeProbesModule = resultAnalyzeCategoriesAndErrors(1, 1, elem.resultCategoryId, elem.errorCode, {
        moduleName: 'Test1',
        moduleSerial: 'Module2',
      })
      const analyzeProbesLot = resultAnalyzeCategoriesAndErrors(
        1,
        1,
        elem.resultCategoryId,

        elem.errorCode,
        {
          consumableLot: 1234,
          assayId: 1,
        }
      )
      assert.isObject(analyzeProbesModule)
      assert.property(analyzeProbesModule, 'type')
      assert.equal(analyzeProbesModule.type, elem.type1)
      assert.equal(analyzeProbesLot.type, elem.type2)
    })
  })
  it('Should analyze different scenarios based on the data for triggering an action', () => {
    ;[
      {
        resultCategoryId: 'Invalid',
        type1: 'RESULT_ANALYZE_INVALIDS_MODULE',
        type2: 'RESULT_ANALYZE_INVALIDS_LOT',
      },
      {
        resultCategoryId: 'Non-existing',
        type1: 'RESULT_ANALYZE_PROBES_MODULE',
        type2: 'RESULT_ANALYZE_PROBES_LOT',
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
      const analyzeProbesLot = resultAnalyzeCategoriesAndErrors(
        1,
        1,
        elem.resultCategoryId,
        elem.errorCode,

        {
          consumableLot: 1234,
          assayId: 1,
        }
      )
      assert.isObject(analyzeProbesModule)
      assert.property(analyzeProbesModule, 'type')
      assert.equal(analyzeProbesModule.type, elem.type1)
      assert.equal(analyzeProbesLot.type, elem.type2)
    })
  })
})
