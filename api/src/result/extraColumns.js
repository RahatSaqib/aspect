const _ = require('lodash')

const applyExtraColumns = (results, extraColumns) => {
  _.each(results, r => {
    // if assay specified columns from the resultData field, parse them to valid JSON
    if (extraColumns) {
      _.each(extraColumns, c => {
        if (c && c.db.indexOf('resultCategory') === -1) {
          let value = r[c.db]

          if (c.postProcess) value = c.postProcess(value)

          if (!c.fieldName) _.set(c, 'fieldName', c.db)

          _.set(r, c.fieldName, value)
        }
      })
    }
  })
}

const sanitizeExtraColumns = extraColumns => {
  extraColumns.forEach((columnValue, columnIndex) => {
    extraColumns[columnIndex] = _.omit(columnValue, ['postProcess', 'db'])
  })
}

module.exports = {
  applyExtraColumns,
  sanitizeExtraColumns,
}
