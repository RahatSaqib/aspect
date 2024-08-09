const omit = require('lodash/omit')
const startCase = require('lodash/startCase')
const { getDeviceWorkload } = require('./common/db')
const { getAssay } = require('../assay/common/db')
const { getConstraints } = require('../auth/constraints')
const { XDR_RESISTANCES } = require('../shared/constants')
const { listResultCategoryGroupsForSelectList } = require('../resultCategoryGroup/service')

// Helper function to determine the label based on the result name
const getCommonLabel = name => {
  if (name.includes('Error')) return 'Error'
  if (name.includes('Invalid')) return 'Invalid'
  if (name.includes('No Result')) return 'No Result'
  return name
}

const buildNewColumns = resultCategories => {
  const uniqueLabels = new Set()

  const extraColumns = resultCategories
    // eslint-disable-next-line array-callback-return
    .map(result => {
      const label = getCommonLabel(result.name)

      // Only add the result if the label has not been used
      if (!uniqueLabels.has(label)) {
        uniqueLabels.add(label)

        return {
          label,
          fieldId: `${result.assayI18nKey}-${result.i18nKey}`,
          resultCategoryLabelI18nKey: result.assayI18nKey,
          resultCategoryI18nKey: result.i18nKey,
          selector: result.resultCategory2
            ? `SUM(CASE WHEN resultCategory1 = ${result.resultCategory1} AND resultCategory2 = ${result.resultCategory2} THEN 1 ELSE 0 END)`
            : `SUM(CASE WHEN resultCategory1 = ${result.resultCategory1} THEN 1 ELSE 0 END)`,
        }
      }
    })
    .filter(Boolean) // Filter out the null values

  // Filter out specific categories
  const filteredColumns = extraColumns.filter(column => {
    return column.label !== 'MTB Detected' && column.label !== 'MTB Trace Detected'
  })

  return filteredColumns
}

const buildXdrExtraColumns = isExport => {
  const xdrResult = ['Detected']

  // When exporting the report, we need to also show columns for the XDR Indeterminate and Not Detected cases
  if (isExport) xdrResult.push('Indeterminate', 'NotDetected')

  const extraColumns = []
  XDR_RESISTANCES.forEach(xdrResistance => {
    xdrResult.forEach(result => {
      extraColumns.push({
        label: `${xdrResistance} ${startCase(result)}`,
        resultCategoryLabelI18nKey: `categoryType${xdrResistance}ResistanceI18nKey`,
        resultCategoryI18nKey: `ResultCategory${result}`,
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

  const { data: resultCategories } = await listResultCategoryGroupsForSelectList(request)

  let extraColumns = []

  const commonCategories = ['No Result', 'Error', 'Invalid']
  extraColumns = buildNewColumns(resultCategories)
  if (assay.externalId === 'GxMtbXdr') {
    const filteredColumns = extraColumns.filter(col => commonCategories.includes(col.label))
    extraColumns = [...filteredColumns, ...buildXdrExtraColumns(query.isExport)]
  }

  const { total, length, data } = await getDeviceWorkload(extraColumns, dataConstraints, query, auth)
  extraColumns = extraColumns.map(ec => omit(ec, 'selector'))
  return { ok: true, total, length, data, extraColumns }
}

module.exports = listWorkload
