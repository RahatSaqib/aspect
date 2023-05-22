const { differenceInDays } = require('date-fns')
const { isNil } = require('lodash')
const { getFollowUpByType } = require('./getFollowUpByType')
const { SEVERITY_THRESHOLDS } = require('../consts')

/**
 * Determines severity level based on given data and followups.
 * @function
 * @param {Object} data - The data object.
 * @param {Array} followUps - The array of followups.
 * @returns {string} - Severity level ('success', 'warning', 'danger', or 'info').
 */

function generateSeverity(data, followUps) {
  const daysDiff = differenceInDays(new Date(), new Date(data?.testDate ?? new Date()))
  const isOnTreatment = !isNil(getFollowUpByType(followUps, 'treatment'))

  if (isOnTreatment) return 'success'
  if (daysDiff > SEVERITY_THRESHOLDS.DANGER) return 'danger'
  if (daysDiff > SEVERITY_THRESHOLDS.WARNING) return 'warning'
  return 'info'
}

module.exports = { generateSeverity }
