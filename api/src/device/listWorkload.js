const omit = require('lodash/omit')
const { getResultCategoriesByAssay, getDeviceWorkload } = require('./common/db')
const { getAssay } = require('../assay/common/db')
const { getConstraints } = require('../auth/constraints')

const buildExtraColumns = (
  resultCategoryIx,
  resultCategoryResultsId,
  resultCategoryResultsI18nKey,
  resultCategoryLabelI18nKey
) => {
  const extraColumns = []
  for (let index = 0; index < resultCategoryResultsId.length; index++) {
    extraColumns.push({
      resultCategoryLabelI18nKey,
      resultCategoryI18nKey: resultCategoryResultsI18nKey[index],
      fieldId: `${resultCategoryLabelI18nKey}-${resultCategoryResultsI18nKey[index]}`,
      selector: `SUM(CASE WHEN resultCategory${resultCategoryIx} = ${resultCategoryResultsId[index]} THEN 1 ELSE 0 END)`,
    })
  }
  return extraColumns
}

const xdrExtraColumns = ['INH', 'FLQ', 'AMK', 'KAN', 'CAP', 'ETH'].map(resistance => ({
  resultCategoryLabelI18nKey: `categoryType${resistance}ResistanceI18nKey`,
  resultCategoryI18nKey: 'ResultCategoryDetected',
  fieldId: `categoryType${resistance}ResistanceI18nKey-ResultCategoryDetected`,
  selector: `SUM(
    CASE WHEN
      JSON_SEARCH(
        r.resultData ->> '$.detectedResistance[*]',
        'one',
        '${resistance}'
      ) IS NOT NULL
    THEN 1 ELSE 0 END)`,
}))

const listWorkload = async request => {
  const { query, auth } = request

  const dataConstraints = await getConstraints(auth.credentials)

  const { assayId } = query
  const assay = await getAssay(assayId)

  const resultCategoryAssay = await getResultCategoriesByAssay(assayId)
  const resultCategory1ResultsI18nKey = resultCategoryAssay.resultCategory1ResultsI18nKey?.split(',') || []
  const resultCategory1ResultsId = resultCategoryAssay.resultCategory1ResultsId?.split(',') || []
  const resultCategory2ResultsI18nKey = resultCategoryAssay.resultCategory2ResultsI18nKey?.split(',') || []
  const resultCategory2ResultsId = resultCategoryAssay.resultCategory2ResultsId?.split(',') || []

  let extraColumns = []

  if (resultCategory1ResultsId !== null) {
    extraColumns = buildExtraColumns(
      1,
      resultCategory1ResultsId,
      resultCategory1ResultsI18nKey,
      resultCategoryAssay.resultCategory1LabelI18nKey
    )
  }

  if (assay.externalId === 'GxMtbXdr') {
    extraColumns = [...extraColumns, ...xdrExtraColumns]
  } else if (resultCategory1ResultsId !== null) {
    extraColumns = [
      ...extraColumns,
      ...buildExtraColumns(
        2,
        resultCategory2ResultsId,
        resultCategory2ResultsI18nKey,
        resultCategoryAssay.resultCategory2LabelI18nKey
      ),
    ]
  }

  const data = await getDeviceWorkload(extraColumns, dataConstraints, query)
  extraColumns = extraColumns.map(ec => omit(ec, 'selector'))
  return { ok: true, total: 0, length: 0, data, extraColumns }
}

module.exports = listWorkload
