const { assert } = require('chai')
const _ = require('lodash')
const {
  getResultCategoriesHivVL,
  getVLCopies,
} = require('../../../src/plugin/deviceType/GxConnect/resultCategories/resultCategoriesMapping')
const {
  detectedLess1000,
  detectedMoreThan1000,
  noDetected,
  detectedWithNoCopies,
  invalidCategory,
  errorCategory,
  resultTextNull,
  badCategorizedResults,
  badCategorizedResults2,
} = require('./HIV_VL_payload')
const { getResultCategories, extractSampleId } = require('../../../src/plugin/deviceType/gxUtils')

describe('Extracting data from Result Text HIV VL', () => {
  it('it extract the number of copies and categorizes it', () => {
    const resultText = [
      {
        resulText: 'HIV-1 DETECTED < 40 copies/mL (log 1.60)',
        value: 'LessThan40',
        copies: null,
      },
      {
        resulText: 'HIV-1 DETECTED 40 copies/mL (log 1.60)',
        value: 'LessThan1000',
        copies: 40,
      },
      {
        resulText: null,
        value: 'NoResult',
        copies: null,
      },
      {
        resulText: 'HIV-1 DETECTED 1.59E03 copies/mL (log 3.20)',
        value: 'MoreThan1000',
        copies: 1590,
      },
      {
        resulText: 'HIV-1 DETECTED > 40 copies/mL (log 3.20)',
        value: 'LessThan1000',
        copies: 40,
      },
      {
        resulText: 'HIV-1 DETECTED 159003 copies/mL (log 3.20)',
        value: 'MoreThan1000',
        copies: 159003,
      },
      {
        resulText: 'HIV-1 DETECTED 44 copies/mL (log 1.64)',
        value: 'LessThan1000',
        copies: 44,
      },
    ]
    resultText.forEach(elem => {
      assert.equal(elem.copies, getVLCopies(elem.resulText ? elem.resulText.replace('HIV-1', '') : elem.resulText))

      assert.equal(
        elem.value,
        getResultCategoriesHivVL(elem.resulText ? elem.resulText.replace('HIV-1', '') : elem.resulText)
      )
    })
  })

  it('Check the category for different results HIV VL', async () => {
    const textsToTest = [
      { payload: detectedLess1000[0].result, expectedCategory: 'LessThan40' },
      { payload: detectedLess1000[1].result, expectedCategory: 'LessThan1000' },
      {
        payload: detectedMoreThan1000.result,
        expectedCategory: 'MoreThan1000',
      },
      { payload: noDetected.result, expectedCategory: 'NotDetected' },
      { payload: detectedWithNoCopies.result, expectedCategory: 'NoResult' },
      { payload: invalidCategory.result, expectedCategory: 'Invalid' },
      { payload: errorCategory.result, expectedCategory: 'Error' },
      { payload: resultTextNull.result, expectedCategory: 'NoResult' },
      {
        payload: badCategorizedResults.result,
        expectedCategory: 'NotDetected',
      },
      {
        payload: badCategorizedResults2.result,
        expectedCategory: 'LessThan40',
      },
    ]
    textsToTest.forEach(elem => {
      const payload = _.assign({}, elem.payload)
      const assayExternalId = _.get(payload, 'assay.id')
      const resultText = _.get(payload, 'data.resultText')
      const [{ id: categoryExternalId }] = getResultCategories(assayExternalId, resultText)
      assert.equal(categoryExternalId, elem.expectedCategory)
    })
  })
})

describe('extractSampleId', () => {
  it('should extract sample ID from payload.sample.id when valid', () => {
    const payload = {
      sample: {
        id: '123-456789-123',
      },
      result: {
        data: {
          patient: {
            id: '123-999999-123',
          },
        },
      },
      notes: 'do not parse this 444-555666-777, better from sample.id',
    }
    assert.equal(extractSampleId(payload), '123-456789-123')
  })

  it('should extract sample ID from payload.result.data.patient.id when valid', () => {
    const payload = {
      sample: {
        id: '',
      },
      result: {
        data: {
          patient: {
            id: '123-456789-123',
          },
        },
      },
      notes: 'do not parse this 444-555666-777, better from result.data.patient.id',
    }

    assert.equal(extractSampleId(payload), '123-456789-123')
  })

  it('must return payload.sample.id, even an invalid one, if there is not a valid one in notes', () => {
    const payload = {
      sample: {
        id: 'invalid-format',
      },
    }
    assert.equal(extractSampleId(payload), 'invalid-format')
  })

  it('should extract sample ID from notes when payload.sample.id is missing', () => {
    const payload = {
      notes: 'Sample ID: 123-456789-123 was processed',
    }
    assert.equal(extractSampleId(payload), '123-456789-123')
  })

  it('should extract sample ID from notes when payload.sample.id is invalid', () => {
    const payload = {
      sample: {
        id: 'invalid-format',
      },
      notes: 'Sample ID: 123-456789-123 was processed',
    }
    assert.equal(extractSampleId(payload), '123-456789-123')
  })

  it('should return null when no valid sample ID is found', () => {
    const payload = {
      notes: 'No sample ID in this note',
    }
    assert.isNull(extractSampleId(payload))
  })

  it('should extract first valid sample ID when multiple are present in notes', () => {
    const payload = {
      notes: 'Sample IDs: 123-456789-123 and 456-789123-456 were processed',
    }
    assert.equal(extractSampleId(payload), '123-456789-123')
  })
})
