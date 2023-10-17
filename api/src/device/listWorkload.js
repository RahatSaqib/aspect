const omit = require('lodash/omit')
const { getResultCategoriesByAssay, getDeviceWorkload } = require('./common/db')
const { getAssay } = require('../assay/common/db')
const { getConstraints } = require('../auth/constraints')
const { XDR_RESISTANCES } = require('../shared/constants')

const buildExtraColumns = (
  resultCategoryIx,
  resultCategoryResultsId,
  resultCategoryResultsI18nKey,
  resultCategoryLabelI18nKey,
  resultCategoryLabel,
  resultCategoryResultsLabel
) => {
  const extraColumns = []
  for (let index = 0; index < resultCategoryResultsId.length; index++) {
    extraColumns.push({
      label: `${resultCategoryLabel}-${resultCategoryResultsLabel[index]}`,
      resultCategoryLabelI18nKey,
      resultCategoryI18nKey: resultCategoryResultsI18nKey[index],
      fieldId: `${resultCategoryLabelI18nKey}-${resultCategoryResultsI18nKey[index]}`,
      selector: `SUM(CASE WHEN resultCategory${resultCategoryIx} = ${resultCategoryResultsId[index]} THEN 1 ELSE 0 END)`,
    })
  }
  return extraColumns
}

const buildXdrExtraColumns = () => {
  const xdrResult = ['Detected', 'Indeterminate', 'NotDetected']
  const extraColumns = []
  XDR_RESISTANCES.forEach(xdrResistance => {
    xdrResult.forEach(result => {
      extraColumns.push({
        label: `${xdrResistance} ${result}`,
        resultCategoryLabelI18nKey: `categoryType${xdrResistance}ResistanceI18nKey`,
        resultCategoryI18nKey: 'ResultCategoryDetected',
        fieldId: `categoryType${xdrResistance}ResistanceI18nKey-ResultCategory${result}`,
        selector: `SUM(
          CASE WHEN
            r.resultData ->> '$.allResistances.${xdrResistance}' = '${result}'
          THEN 1 ELSE 0 END)`,
      })
    })
  })

  return extraColumns
}

const listWorkload = async request => {
  const { query, auth } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const { assayId } = query
  const assay = await getAssay(assayId)

  const resultCategoryAssay = await getResultCategoriesByAssay(assayId)
  const resultCategory1ResultsI18nKey = resultCategoryAssay.resultCategory1ResultsI18nKey?.split(',') || []
  const resultCategory1ResultsLabel = resultCategoryAssay.resultCategory1ResultsLabel?.split(',') || []
  const resultCategory2ResultsLabel = resultCategoryAssay.resultCategory2ResultsLabel?.split(',') || []
  const resultCategory1ResultsId = resultCategoryAssay.resultCategory1ResultsId?.split(',') || []
  const resultCategory2ResultsI18nKey = resultCategoryAssay.resultCategory2ResultsI18nKey?.split(',') || []
  const resultCategory2ResultsId = resultCategoryAssay.resultCategory2ResultsId?.split(',') || []

  let extraColumns = []

  if (resultCategory1ResultsId !== null) {
    extraColumns = buildExtraColumns(
      1,
      resultCategory1ResultsId,
      resultCategory1ResultsI18nKey,
      resultCategoryAssay.resultCategory1LabelI18nKey,
      resultCategoryAssay.resultCategory1Label,
      resultCategory1ResultsLabel
    )
  }

  if (assay.externalId === 'GxMtbXdr') {
    extraColumns = [...extraColumns, ...buildXdrExtraColumns()]
  } else if (resultCategory1ResultsId !== null) {
    extraColumns = [
      ...extraColumns,
      ...buildExtraColumns(
        2,
        resultCategory2ResultsId,
        resultCategory2ResultsI18nKey,
        resultCategoryAssay.resultCategory2LabelI18nKey,
        resultCategoryAssay.resultCategory2Label,
        resultCategory2ResultsLabel
      ),
    ]
  }
  const { total, length, data } = await getDeviceWorkload(extraColumns, dataConstraints, query)
  extraColumns = extraColumns.map(ec => omit(ec, 'selector'))
  return { ok: true, total, length, data, extraColumns }
}

module.exports = listWorkload
