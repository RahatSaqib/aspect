const { assert } = require('chai')
const { mapResultCategory2 } = require('../../../src/plugin/deviceType/GxConnect/resultCategories/resultCategoriesMapping')
const { splitResultTextValues } = require('../../../src/plugin/deviceType/GxConnect/resultCategories/utils')

describe('Result Category Mapping', () => {
  describe('Result Category 2', () => {
    it('provide a not allowed assay, map null', () => {
      assert.isNull(mapResultCategory2('This assay has not a mapper for resultCategory2', 'MTB Detected|Rif Resistance DETECTED'))
    })

    describe('GxMtbXDR', () => {
      it('no results provided, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues('')
        assert.isNull(mapResultCategory2('GxMtbXDR', resultTextValues))
      })

      it('result category 1 not detected, no resistance specified, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_not_detected||'
        )
        assert.isNull(mapResultCategory2('GxMtbXDR', resultTextValues))
      })

      it('result category 1 not detected, resistance specified, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_not_detected||INH Resistance @label_result_not_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_not_detected'
        )
        assert.isNull(mapResultCategory2('GxMtbXDR', resultTextValues))
      })

      it('result category 1 detected, no resistance detected, map result category 2 NotDetected', () => {
        const resultTextValues = splitResultTextValues('|MTB @label_result_detected||INH Resistance @label_result_not_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_not_detected')
        assert.equal(mapResultCategory2('GxMtbXDR', resultTextValues), 'NotDetected')
      })

      it('result category 1 detected, at least 1 resistance detected, map result category 2 Detected', () => {
        const resultTextValues = splitResultTextValues('|MTB @label_result_detected||INH Resistance @label_result_not_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_detected')
        assert.equal(mapResultCategory2('GxMtbXDR', resultTextValues), 'Detected')
      })

      it('result category 1 error, map Error', () => {
        const resultTextValues = splitResultTextValues('|MTB @label_result_error||INH Resistance @label_result_not_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_detected')
        assert.equal(mapResultCategory2('GxMtbXDR', resultTextValues), 'Error')
      })

      it('result category 1 invalid, map Invalid', () => {
        const resultTextValues = splitResultTextValues('|MTB @label_result_invalid||INH Resistance @label_result_not_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_detected')
        assert.equal(mapResultCategory2('GxMtbXDR', resultTextValues), 'Invalid')
      })

      it('result category 1 no result, map NoResult', () => {
        const resultTextValues = splitResultTextValues('|MTB @label_result_no_result||INH Resistance @label_result_not_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_detected')
        assert.equal(mapResultCategory2('GxMtbXDR', resultTextValues), 'NoResult')
      })
    })

    describe('GxEbola', () => {
      it('no results provided, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues('')
        assert.isNull(mapResultCategory2('GxEbola', resultTextValues))
      })

      it('GP any value, NP not specified, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues(
          '|EBOLA GP any value||'
        )
        assert.isNull(mapResultCategory2('GxEbola', resultTextValues))
      })

      it('GP any value, NP detected, map result category 2 Detected', () => {
        const resultTextValues = splitResultTextValues(
          '|EBOLA GP any value|||EBOLA NP @label_result_detected||'
        )
        assert.equal(mapResultCategory2('GxEbola', resultTextValues), 'Detected')
      })
      
      it('GP any value, NP not detected, map result category 2 NotDetected', () => {
        const resultTextValues = splitResultTextValues(
          '|EBOLA GP any value|||EBOLA NP @label_result_not_detected||'
        )
        assert.equal(mapResultCategory2('GxEbola', resultTextValues), 'NotDetected')
      })
    })

    describe('GxMtbRif', () => {
      it('no results provided, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues('')
        assert.isNull(mapResultCategory2('GxMtbRif', resultTextValues))
      })

      it('result category 1 not detected, rif resistance not specified, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_not_detected||'
        )
        assert.isNull(mapResultCategory2('GxMtbRif', resultTextValues))
      })

      it('result category 1 not detected, rif resistance specified, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_not_detected||Rif Resistance @label_result_not_detected'
        )
        assert.isNull(mapResultCategory2('GxMtbRif', resultTextValues))
      })

      it('result category 1 detected, rif resistance detected, map result category 2 Detected', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_detected||Rif Resistance @label_result_detected'
          )
        assert.equal(mapResultCategory2('GxMtbRif', resultTextValues), 'Detected')
      })

      it('result category 1 detected, rif resistance not detected, map result category 2 NotDetected', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_detected||Rif Resistance @label_result_not_detected'
          )
        assert.equal(mapResultCategory2('GxMtbRif', resultTextValues), 'NotDetected')
      })

      it('result category 1 error, map Error', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_error||Rif Resistance @label_result_not_detected'
        )
        assert.equal(mapResultCategory2('GxMtbRif', resultTextValues), 'Error')
      })

      it('result category 1 invalid, map Invalid', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_invalid||Rif Resistance @label_result_not_detected'
        )
        assert.equal(mapResultCategory2('GxMtbRif', resultTextValues), 'Invalid')
      })

      it('result category 1 no result, map NoResult', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_no_result||Rif Resistance @label_result_not_detected'
        )
        assert.equal(mapResultCategory2('GxMtbRif', resultTextValues), 'NoResult')
      })
    })

    describe('GxMtbRifUltra', () => {
      it('no results provided, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues('')
        assert.isNull(mapResultCategory2('GxMtbRifUltra', resultTextValues))
      })

      it('result category 1 not detected, rif resistance not specified, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_not_detected||'
        )
        assert.isNull(mapResultCategory2('GxMtbRifUltra', resultTextValues))
      })

      it('result category 1 not detected, rif resistance specified, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_not_detected||Rif Resistance @label_result_not_detected'
        )
        assert.isNull(mapResultCategory2('GxMtbRifUltra', resultTextValues))
      })

      it('result category 1 detected, rif resistance detected, map result category 2 Detected', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_detected||Rif Resistance @label_result_detected'
          )
        assert.equal(mapResultCategory2('GxMtbRifUltra', resultTextValues), 'Detected')
      })

      it('result category 1 detected, rif resistance not detected, map result category 2 NotDetected', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_detected||Rif Resistance @label_result_not_detected'
          )
        assert.equal(mapResultCategory2('GxMtbRifUltra', resultTextValues), 'NotDetected')
      })

      it('result category 1 error, map Error', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_error||Rif Resistance @label_result_not_detected'
        )
        assert.equal(mapResultCategory2('GxMtbRifUltra', resultTextValues), 'Error')
      })

      it('result category 1 invalid, map Invalid', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_invalid||Rif Resistance @label_result_not_detected'
        )
        assert.equal(mapResultCategory2('GxMtbRifUltra', resultTextValues), 'Invalid')
      })

      it('result category 1 no result, map NoResult', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_no_result||Rif Resistance @label_result_not_detected'
        )
        assert.equal(mapResultCategory2('GxMtbRifUltra', resultTextValues), 'NoResult')
      })
    })
  })
})
