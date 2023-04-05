const { subDays } = require('date-fns')
const _ = require('lodash')

const { SELECT_FIELDS_FOR_DATA_EXTRACT_REPORT } = require('../query')
const { sortPageParams } = require('../../db')
const { getQueryForDataExtract } = require('../common/db')
const { getConstraints } = require('../../auth/constraints')

// ------------------------------------------------------
async function getDataExtractReport(auth, query) {
  query.page = 0
  query.size = query.maxNumberOfRecords || 50000
  if (_.isNil(query.minDate)) query.minDate = subDays(new Date(query.maxDate), query.daysToSubstract || 180)
  /**
   *
   */
  const selectFields = SELECT_FIELDS_FOR_DATA_EXTRACT_REPORT
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = getQueryForDataExtract(query, dataConstraints)
  const getCount = resultQuery.clone().count('r.id as total').first()

  const getData = resultQuery.clone().groupBy('r.id').modify(sortPageParams, query, 'endedOn').select(selectFields)
  const [{ total }, data] = await Promise.all([getCount, getData])
  const columns = _.keys(selectFields).map(fieldName => {
    return {
      key: fieldName,
      header: fieldName,
    }
  })

  const dataset = {
    ok: true,
    total,
    length: _.get(data, 'length', 0),
    data,
    dynamicColumns: columns,
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }
  return dataset
}

module.exports = getDataExtractReport
