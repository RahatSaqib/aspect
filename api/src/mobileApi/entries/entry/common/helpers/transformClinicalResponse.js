const { getFollowUpByType } = require('./getFollowUpByType')
const { FOLLOW_UP_TYPES } = require('../consts')

function transformClinicalResponse(data, followUps, acknowledgedId) {
  const treatment = getFollowUpByType(followUps, FOLLOW_UP_TYPES.TREATMENT)
  const outcome = getFollowUpByType(followUps, FOLLOW_UP_TYPES.OUTCOME)
  const isRecorded = data.resultWorkflowStatusId === acknowledgedId
  if (!isRecorded && !treatment && !outcome) return {}
  return {
    resultId: data.id,
    confirmedOn: isRecorded ? data.resultWorkflowStatusChangedOn : null,
    outcome: outcome?.externalId || null,
    outcomeOccurred: outcome?.date || null,
    recorded: isRecorded,
    treatment: treatment?.externalId ?? null,
    treatmentStarted: treatment?.date ?? null,
  }
}

module.exports = { transformClinicalResponse }
