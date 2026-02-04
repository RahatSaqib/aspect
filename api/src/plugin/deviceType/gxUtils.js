const _ = require('lodash')
const {
  result1CategoryMapping,
  mapResultCategory2,
  getResultCategoriesHivVL,
  getResultCategoriesHcv,
  getVLCopies,
  getXdrDetectedResistanceCategoryTypes,
  getBacterialLoad,
} = require('./GxConnect/resultCategories/resultCategoriesMapping')
const { splitResultTextValues, sanitizeResultTextValue } = require('./GxConnect/resultCategories/utils')

function getAdditionalDataFromPayload(payload, assays) {
  const data = {}
  if (assays.includes('GxMtbRif') && _.get(payload, 'data.resultText')) {
    const bacterialLoad = getBacterialLoad(_.get(payload, 'data.resultText'))
    if (bacterialLoad) data.bacterialLoad = bacterialLoad
  }

  if (assays.includes('GxHiv1Vl')) {
    const copies = getVLCopies(_.get(payload, 'data.resultText'))
    if (copies) data.copies = copies
  }

  if (assays.includes('GxMtbXdr')) {
    const { detectedResistance, allResistances } = getXdrDetectedResistanceCategoryTypes(
      _.get(payload, 'data.resultText')
    )
    data.detectedResistance = detectedResistance
    data.allResistances = allResistances
  }

  return data
}

function getResultCategories(assayExternalId, resultText) {
  const categories = []

  if (resultText) {
    const parts = splitResultTextValues(resultText)

    if (parts.length === 0) return categories

    const status = sanitizeResultTextValue(parts[0])

    if (assayExternalId === 'GxHcv') {
      const hivCategory = getResultCategoriesHcv(status)
      return [{ id: hivCategory }]
    }

    if (assayExternalId === 'GxHiv1Vl') {
      const hivCategory = getResultCategoriesHivVL(status)
      if (hivCategory) categories.push({ id: hivCategory })
    }

    if (categories.length === 0) {
      const category1 = result1CategoryMapping[status]
      if (category1) categories.push({ id: category1 })
    }

    const category2 = mapResultCategory2(assayExternalId, parts)
    if (category2) categories.push({ id: category2 })
  } else if (assayExternalId === 'GxHiv1Vl') categories.push({ id: 'NoResult' })

  return categories
}

module.exports = {
  getAdditionalDataFromPayload,
  getResultCategories,
}
