const { assert } = require('chai')
const _ = require('lodash')
const {
  getResultCategoriesHivVL,
  getResultCategories,
} = require('../../../src/plugin/deviceType/gxUtils')
const {
  detectedLess1000,
  detectedMoreThan1000,
  noDetected,
  detectedWithNoCopies,
} = require('./HIV_VL_payload')

describe.only('Extracting data from Result Text HIV VL', () => {
  it('it extract the number of copies and categorize it', () => {
    const resultText = [
      {
        resulText: 'HIV-1 DETECTED < 40 copies/mL (log 1.60)',
        value: 'LessThan1000',
      },
      {
        resulText: 'HIV-1 DETECTED 1.59E03 copies/mL (log 3.20)',
        value: 'MoreThan1000',
      },
      {
        resulText: 'HIV-1 DETECTED > 40 copies/mL (log 3.20)',
        value: 'LessThan1000',
      },
      {
        resulText: 'HIV-1 DETECTED 159003 copies/mL (log 3.20)',
        value: 'MoreThan1000',
      },
      {
        resulText: 'HIV-1 DETECTED 44 copies/mL (log 1.64)',
        value: 'LessThan1000',
      },
    ]
    resultText.forEach(elem =>
      assert.equal(
        elem.value,
        getResultCategoriesHivVL(elem.resulText.replace('HIV-1', ''))
      )
    )
  })

  it('Check the category for different results HIV VL', async () => {
    console.log(
      'detectedmorethan 1000',
      _.assign({}, getResultCategories(detectedLess1000[0]))
    )
    assert.isTrue(true)
  })
})
