const { differenceInDays } = require('date-fns')
const { isNil } = require('lodash')
const { getFollowUpByType } = require('./getFollowUpByType')

function generateSeverity(data, followUps) {
  const daysDiff = differenceInDays(new Date(), new Date(data?.resultTreatmentStatusChangedOn ?? new Date()))
  const isOnTreatment = !isNil(getFollowUpByType(followUps, 'treatment'))

  if (isOnTreatment) return 'success'
  if (daysDiff > 32) return 'danger'
  if (daysDiff > 16) return 'warning'
  return 'info'
}

module.exports = { generateSeverity }
