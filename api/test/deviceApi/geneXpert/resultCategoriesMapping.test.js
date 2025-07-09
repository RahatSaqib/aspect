const { assert } = require('chai')
const {
  mapResultCategory2,
  parseXdrResultText,
  getXdrDetectedResistanceCategoryTypes,
  getBacterialLoad,
} = require('../../../src/plugin/deviceType/GxConnect/resultCategories/resultCategoriesMapping')
const { splitResultTextValues } = require('../../../src/plugin/deviceType/GxConnect/resultCategories/utils')
const { getResultCategories } = require('../../../src/plugin/deviceType/gxUtils')

describe('Result Category Mapping', () => {
  describe('Result Category 2', () => {
    it('provide a not allowed assay, map null', () => {
      assert.isNull(
        mapResultCategory2(
          'This assay does not have a mapper for resultCategory2',
          'MTB Detected|Rif Resistance DETECTED'
        )
      )
    })

    describe('GxMtbXdr', () => {
      it('no results provided, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues('')
        assert.isNull(mapResultCategory2('GxMtbXdr', resultTextValues))
      })

      it('mtb not detected, no resistance specified, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues('|MTB @label_result_not_detected||')
        assert.isNull(mapResultCategory2('GxMtbXdr', resultTextValues))
      })

      it('mtb not detected, resistance specified, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_not_detected||INH Resistance @label_result_not_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_not_detected'
        )
        assert.isNull(mapResultCategory2('GxMtbXdr', resultTextValues))
      })

      it('mtb detected, no resistance detected, map result category 2 NotDetected', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_detected||INH Resistance @label_result_not_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_not_detected'
        )
        assert.equal(mapResultCategory2('GxMtbXdr', resultTextValues), 'NotDetected')
      })

      it('mtb detected, at least 1 resistance detected, map result category 2 Detected', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_detected||INH Resistance @label_result_not_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_detected'
        )
        assert.equal(mapResultCategory2('GxMtbXdr', resultTextValues), 'Detected')
      })

      it('mtb detected, at least 1 resistance detected and another indeterminate, map result category 2 Detected', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_detected|Low INH Resistance @label_result_detected|||FLQ Resistance @label_result_detected|AMK Resistance @label_result_detected|KAN Resistance @label_result_detected|CAP Resistance @label_result_indeterminate|ETH Resistance @label_result_detected'
        )
        assert.equal(mapResultCategory2('GxMtbXdr', resultTextValues), 'Detected')
      })

      it('mtb error, map null', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_error||INH Resistance @label_result_not_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_detected'
        )
        assert.equal(mapResultCategory2('GxMtbXdr', resultTextValues), null)
      })

      it('mtb invalid, map null', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_invalid||INH Resistance @label_result_not_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_detected'
        )
        assert.equal(mapResultCategory2('GxMtbXdr', resultTextValues), null)
      })

      it('mtb no result, map null', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_no_result||INH Resistance @label_result_not_detected||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_detected'
        )
        assert.equal(mapResultCategory2('GxMtbXdr', resultTextValues), null)
      })

      it('mtb detected, 1 low detected resistance, map Detected', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_detected|Low INH Resistance @label_result_detected|||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_not_detected'
        )
        assert.equal(mapResultCategory2('GxMtbXdr', resultTextValues), 'Detected')
      })

      it('mtb detected, 1 very low detected resistance, map Detected', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_detected|Very Low INH Resistance @label_result_detected|||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_not_detected'
        )
        assert.equal(mapResultCategory2('GxMtbXdr', resultTextValues), 'Detected')
      })

      it('mtb detected, 1 medium detected resistance, map Detected', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_detected|Medium INH Resistance @label_result_detected|||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_not_detected'
        )
        assert.equal(mapResultCategory2('GxMtbXdr', resultTextValues), 'Detected')
      })

      it('mtb detected, 1 high detected resistance, map Detected', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_detected|High INH Resistance @label_result_detected|||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_not_detected|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_not_detected'
        )
        assert.equal(mapResultCategory2('GxMtbXdr', resultTextValues), 'Detected')
      })
    })

    describe('GxEbola', () => {
      it('no results provided, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues('')
        assert.isNull(mapResultCategory2('GxEbola', resultTextValues))
      })

      it('GP any value, NP not specified, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues('|EBOLA GP any value||')
        assert.isNull(mapResultCategory2('GxEbola', resultTextValues))
      })

      it('GP any value, NP detected, map result category 2 Detected', () => {
        const resultTextValues = splitResultTextValues('|EBOLA GP any value|||EBOLA NP @label_result_detected||')
        assert.equal(mapResultCategory2('GxEbola', resultTextValues), 'Detected')
      })

      it('GP any value, NP not detected, map result category 2 NotDetected', () => {
        const resultTextValues = splitResultTextValues('|EBOLA GP any value|||EBOLA NP @label_result_not_detected||')
        assert.equal(mapResultCategory2('GxEbola', resultTextValues), 'NotDetected')
      })
    })

    describe('GxMtbRif', () => {
      it('no results provided, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues('')
        assert.isNull(mapResultCategory2('GxMtbRif', resultTextValues))
      })

      it('result category 1 not detected, rif resistance not specified, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues('|MTB @label_result_not_detected||')
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

      it('result category 1 error, map null', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_error||Rif Resistance @label_result_not_detected'
        )
        assert.equal(mapResultCategory2('GxMtbRif', resultTextValues), null)
      })

      it('result category 1 invalid, map null', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_invalid||Rif Resistance @label_result_invalid'
        )
        assert.equal(mapResultCategory2('GxMtbRif', resultTextValues), null)
      })

      it('result category 1 no result, map null', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_no_result||Rif Resistance @label_result_not_detected'
        )
        assert.equal(mapResultCategory2('GxMtbRif', resultTextValues), null)
      })
    })

    describe('GxMtbRifUltra', () => {
      it('no results provided, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues('')
        assert.isNull(mapResultCategory2('GxMtbRifUltra', resultTextValues))
      })

      it('result category 1 not detected, rif resistance not specified, map result category 2 null', () => {
        const resultTextValues = splitResultTextValues('|MTB @label_result_not_detected||')
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

      it('result category 1 error, map null', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_error||Rif Resistance @label_result_not_detected'
        )
        assert.equal(mapResultCategory2('GxMtbRifUltra', resultTextValues), null)
      })

      it('result category 1 invalid, map null', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_invalid||Rif Resistance @label_result_invalid'
        )
        assert.equal(mapResultCategory2('GxMtbRifUltra', resultTextValues), null)
      })

      it('result category 1 no result, map null', () => {
        const resultTextValues = splitResultTextValues(
          '|MTB @label_result_no_result||Rif Resistance @label_result_not_detected'
        )
        assert.equal(mapResultCategory2('GxMtbRifUltra', resultTextValues), null)
      })
    })
  })
})

describe('Result Text Parsing', () => {
  it('Should parse MTB Rif/Ultra result #1', () => {
    assert.deepEqual(parseXdrResultText('|MTB @label_result_detected||Rif Resistance @label_result_not_detected'), {
      MTB: 'Detected',
      'RIF RESISTANCE': 'NotDetected',
    })
  })

  it('Should parse MTB Rif/Ultra result #2', () => {
    assert.deepEqual(parseXdrResultText('|MTB Trace DÉTECTÉ|RIF Resistance INDÉTERMINÉ'), {
      MTB: 'Trace Detected',
      'RIF RESISTANCE': 'Indeterminate',
    })
  })

  // This test is not implemented in Aspect because the function parseXdrResultText is only called in GxMtbXdr devices
  it('Should parse Ebola result', () => {
    assert.deepEqual(
      parseXdrResultText('|EBOLA GP @label_result_not_detected|||EBOLA NP @label_result_not_detected||'),
      {
        'EBOLA GP': 'NotDetected',
        'EBOLA NP': 'NotDetected',
      }
    )
  })

  it('Should parse MTB XDR result', () => {
    assert.deepEqual(
      parseXdrResultText(
        '|MTB @label_result_detected|Medium INH Resistance @label_result_detected|||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_error|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_not_detected'
      ),
      {
        MTB: 'Detected',
        'INH RESISTANCE': 'Detected',
        'FLQ RESISTANCE': 'NotDetected',
        'AMK RESISTANCE': 'Error',
        'KAN RESISTANCE': 'NotDetected',
        'CAP RESISTANCE': 'NotDetected',
        'ETH RESISTANCE': 'NotDetected',
      }
    )
  })

  it('Should not parse category types without values', () => {
    assert.deepEqual(parseXdrResultText('|MTB @label_result_detected||Rif Resistance '), {
      MTB: 'Detected',
    })
  })

  it('Should not parse unexisting category types', () => {
    assert.deepEqual(parseXdrResultText('|MTB @label_result_detected||ANY RESISTANCE '), {
      MTB: 'Detected',
    })
  })

  it('Should not parse unexisting results', () => {
    assert.deepEqual(parseXdrResultText('|MTB @label_result_detected||Rif Resistance UNEXISTING RESULT '), {
      MTB: 'Detected',
    })
  })
})

describe('[COVID] getResultCategories', () => {
  it('Should include all the COVID results', () => {
    assert.deepEqual(getResultCategories('assayGXCovid19', 'SARS-CoV-2 POSITIVE'), [{ id: 'Positive' }])
  })
})

describe('[HIV] getResultCategories', () => {
  it('Should parse detected HIV results #1', () => {
    assert.deepEqual(getResultCategories('GxHiv1Vl', 'HIV-1 DETECTED < 40 copies/mL (log 1.60)'), [
      { id: 'LessThan40' },
    ])
  })

  it('Should parse detected HIV results #2', () => {
    assert.deepEqual(getResultCategories('GxHiv1Vl', 'HIV-1 DÉTECTÉ 6,61E03 copies/mL'), [{ id: 'MoreThan1000' }])
  })

  it('Should parse detected HIV results #3', () => {
    assert.deepEqual(getResultCategories('GxHiv1Vl', 'HIV-1 DETECTED 4.16E06 copies/mL (log 6.62)'), [
      { id: 'MoreThan1000' },
    ])
  })

  it('Should parse detected HIV results #4', () => {
    assert.deepEqual(getResultCategories('GxHiv1Vl', 'HIV-1 DÉTECTÉ 701 copies/mL (log 2,85)'), [
      { id: 'LessThan1000' },
    ])
  })

  it('Should parse detected HIV results #5', () => {
    assert.deepEqual(
      getResultCategories(
        'GxHiv1Vl',
        'HIV-1 @label_quant1_result_normal_log,@label_result_detected,#452,copies/mL,@label_log,#2.66'
      ),
      [{ id: 'LessThan1000' }]
    )
  })

  it('Should parse detected HIV results #6', () => {
    assert.deepEqual(
      getResultCategories(
        'GxHiv1Vl',
        'HIV-1 @label_quant1_result_normal_log,@label_result_detected,#707,copies/mL,@label_log,#2.85'
      ),
      [{ id: 'LessThan1000' }]
    )
  })

  it('Should parse detected HIV results #7', () => {
    assert.deepEqual(
      getResultCategories(
        'GxHiv1Vl',
        'HIV-1 @label_quant1_result_normal_log,@label_result_detected,#4.23E05,copies/mL,@label_log,#5.63'
      ),
      [{ id: 'MoreThan1000' }]
    )
  })

  it('Should parse detected HIV results #8', () => {
    assert.deepEqual(
      getResultCategories(
        'GxHiv1Vl',
        'HIV-1 @label_quant1_result_abnormal_low_log,@label_result_detected,#40,copies/mL,@label_log,#1.60'
      ),
      [{ id: 'LessThan1000' }]
    )
  })

  it('Should parse detected HIV results #9', () => {
    assert.deepEqual(
      getResultCategories(
        'GxHiv1Vl',
        'HIV-1 @label_quant1_result_abnormal_low_log,@label_result_detected,#40,copies/ml,@label_log,#1.60'
      ),
      [{ id: 'LessThan1000' }]
    )
  })

  it('Should parse detected HIV results #10', () => {
    assert.deepEqual(getResultCategories('GxHiv1Vl', 'HIV-1 ОБНАРУЖЕН < 40 copies/mL'), [{ id: 'LessThan40' }])
  })

  it('Should parse not detected HIV results #1', () => {
    assert.deepEqual(getResultCategories('GxHiv1Vl', 'HIV-1 NOT DETECTED'), [{ id: 'NotDetected' }])
  })

  it('Should parse not detected HIV results #2', () => {
    assert.deepEqual(getResultCategories('GxHiv1Vl', 'HIV-1 НЕ ОБНАРУЖЕН'), [{ id: 'NotDetected' }])
  })
})

describe('Detected Resistancies Calculation', () => {
  it('Should get all the category types of the resistancies that were detected', () => {
    const { detectedResistance, allResistances } = getXdrDetectedResistanceCategoryTypes(
      '|MTB @label_result_detected|Medium INH Resistance @label_result_detected|||FLQ Resistance @label_result_indeterminate|AMK Resistance @label_result_error|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_not_detected'
    )
    assert.deepEqual(detectedResistance, ['INH'])
    assert.deepEqual(allResistances, {
      INH: 'Detected',
      FLQ: 'Indeterminate',
      AMK: 'Error',
      KAN: 'NotDetected',
      CAP: 'NotDetected',
      ETH: 'NotDetected',
    })
  })

  it('Should return an empty array if no resistances were detected', () => {
    const { detectedResistance, allResistances } = getXdrDetectedResistanceCategoryTypes(
      '|MTB @label_result_detected|INH Resistance @label_result_not_detected|||FLQ Resistance @label_result_not_detected|AMK Resistance @label_result_error|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_indeterminate|ETH Resistance @label_result_not_detected'
    )
    assert.isEmpty(detectedResistance)
    assert.deepEqual(allResistances, {
      INH: 'NotDetected',
      FLQ: 'NotDetected',
      AMK: 'Error',
      KAN: 'NotDetected',
      CAP: 'Indeterminate',
      ETH: 'NotDetected',
    })
  })

  it('Should not crash if invalid categories are present', () => {
    const { detectedResistance } = getXdrDetectedResistanceCategoryTypes(
      '|MTB @label_result_detected|Medium A_RESISTANCE_ANYONE_KNOWS Resistance @label_result_detected|||FLQ Resistance @label_result_detected|AMK Resistance @label_result_error|KAN Resistance @label_result_not_detected|CAP Resistance @label_result_not_detected|ETH Resistance @label_result_not_detected'
    )
    assert.deepEqual(detectedResistance, ['FLQ'])
  })

  it('Should not crash if result text does not include resistancies', () => {
    const { detectedResistance } = getXdrDetectedResistanceCategoryTypes('|MTB @label_result_detected')
    assert.isEmpty(detectedResistance)
  })
})

describe('Bacterial Load', () => {
  assert.equal(undefined, getBacterialLoad('MTB NOT DETECTED||'))
  assert.equal(
    'Very Low',
    getBacterialLoad(
      'MTB @label_result_concatenate_two,@label_result_detected,@label_semi_quant_level_text_very_low|Rif Resistance @label_result_not_detected|'
    )
  )
  assert.equal('Low', getBacterialLoad('MTB DETECTED LOW||RIF Resistance NOT DETECTED'))
  assert.equal('Medium', getBacterialLoad('MTB DETECTED MEDIUM|Rif Resistance NOT DETECTED|'))
})

describe('[ANY ASSAY] getResultCategories', () => {
  it('Should parse no result #1', () => {
    assert.deepEqual(getResultCategories(null, 'NO RESULT'), [{ id: 'NoResult' }])
  })

  it('Should parse no result #2', () => {
    assert.deepEqual(getResultCategories(null, '@label_result_no_result'), [{ id: 'NoResult' }])
  })

  it('Should parse no result #3', () => {
    assert.deepEqual(getResultCategories(null, '|NO RESULT|'), [{ id: 'NoResult' }])
  })

  it('Should parse no result #4', () => {
    assert.deepEqual(getResultCategories(null, 'НЕТ РЕЗУЛЬТАТА'), [{ id: 'NoResult' }])
  })

  it('Should parse no result #5', () => {
    assert.deepEqual(getResultCategories(null, 'NO RESULT|NO RESULT|'), [{ id: 'NoResult' }])
  })

  it('Should parse no result #6', () => {
    assert.deepEqual(getResultCategories(null, 'NO RESULT||'), [{ id: 'NoResult' }])
  })

  it('Should parse no result #7', () => {
    assert.deepEqual(getResultCategories(null, 'PAS DE RÉSULTAT'), [{ id: 'NoResult' }])
  })

  it('Should parse error', () => {
    assert.deepEqual(getResultCategories(null, 'ОШИБКА'), [{ id: 'Error' }])
  })
})
