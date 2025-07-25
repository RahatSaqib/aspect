const _ = require('lodash')

const { getListResults } = require('../service')
const { getFieldsForQuarterlyReport } = require('../query')
const { GENDER_MAP } = require('../../plugin/partner/Myanmar/shared/constants')

// ---------------------------------------------------------------
async function getDataForQuarterlyReport(auth, query, timezoneIANA) {
  const fields = getFieldsForQuarterlyReport(timezoneIANA)

  if (_.isNil(query.withTags)) {
    query.withTags = true
  }
  const result = await getListResults(query, auth, fields)

  _.each(result.data, d => {
    d.result1 = mapGxAlertResultToAspect(d.result1)
    d.result2 = mapGxAlertResultToAspect(d.result2)
    d.cxrAbnormalities = d.notes?.toLowerCase().includes('cxr') ? 'CXR' : ''
    if (d.gender) d.gender = GENDER_MAP[d.gender.toLowerCase()]
  })

  return result
}

function mapGxAlertResultToAspect(val = '') {
  if (
    [
      /**
       * list of resultCategory for 1-to-1 mapping,
       * same order as in BigPicture db in GxAlert
       */
      'Invalid',
      'Error',
      'Negative',
      'Positive',
      'Indeterminate',
      'No Result',
      '< 40 cp/ml',
      '< 1000 cp/ml',
      '>= 1000 cp/ml',
      'Presumptive Positive',
    ].includes(val)
  ) {
    return val
  }
  if (val === 'Detected' || val?.includes('Positive')) {
    return 'Positive'
  }
  if (val === 'Not Detected') {
    return 'Negative'
  }
  if (val === 'Trace Detected') {
    return 'Trace'
  }
  if (['>= 40 cp/mL', '< 150 cp/mL', '>= 150 cp/mL', '< 550 cp/mL', '>= 550 cp/mL'].includes(val)) {
    return '< 1000 cp/ml'
  }

  return !val ? '' : 'Unknown'
}

module.exports = {
  getDataForQuarterlyReport,
}
