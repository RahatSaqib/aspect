const _ = require('lodash')
const { getFollowUpByType } = require('./getFollowUpByType')
const { FOLLOW_UP_TYPES } = require('../../../common/consts')

function transformClinicalResponse(data, followUps, acknowledgedId) {
  const treatment = getFollowUpByType(followUps, FOLLOW_UP_TYPES.TREATMENT)
  const outcome = getFollowUpByType(followUps, FOLLOW_UP_TYPES.OUTCOME)
  const isRecorded = data.resultWorkflowStatusId === acknowledgedId
  if (!treatment && !outcome) return {}
  const output = {
    resultId: data.id,
    confirmedOn: isRecorded ? data.resultWorkflowStatusChangedOn : null,
    outcome: outcome?.followUpExternalId ?? null,
    outcomeOccurred: outcome?.updatedOn ?? null,
    recorded: isRecorded,
    treatment: treatment?.followUpExternalId ?? null,
    treatmentStarted: treatment?.updatedOn ?? null,
  }
  return _.pickBy(output, _.identity)
}

module.exports = { transformClinicalResponse }
