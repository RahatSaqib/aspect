const { getFollowUpByType } = require('./getFollowUpByType')
const { FOLLOW_UP_TYPES } = require('../../../common/consts')

function transformClinicalResponse(data, followUps, acknowledgedId) {
  const treatment = getFollowUpByType(followUps, FOLLOW_UP_TYPES.TREATMENT)
  const outcome = getFollowUpByType(followUps, FOLLOW_UP_TYPES.OUTCOME)
  const isRecorded = data.resultWorkflowStatusId === acknowledgedId
  if (!isRecorded && !treatment && !outcome) return {}
  return {
    resultId: data.id,
    confirmedOn: isRecorded ? data.resultWorkflowStatusChangedOn : null,
    outcome: outcome?.followUpTypeExternalId ?? null,
    outcomeOccurred: outcome?.updatedOn ?? null,
    recorded: isRecorded,
    treatment: treatment?.followUpTypeExternalId ?? null,
    treatmentStarted: treatment?.updatedOn ?? null,
  }
}

module.exports = { transformClinicalResponse }
