const { getFollowUpByType } = require('./getFollowUpByType')

function transformClinicalResponse(data, followUps, acknowledgedId) {
  const treatment = getFollowUpByType(followUps, 'treatment')
  const outcome = getFollowUpByType(followUps, 'outcome')
  const isRecorded = data.resultWorkflowStatusId === acknowledgedId

  return {
    confirmedOn: isRecorded ? data.resultWorkflowStatusChangedOn : null,
    outcome: outcome?.externalId || null,
    outcomeOccurred: outcome?.date || null,
    recorded: isRecorded,
    treatment: treatment?.externalId ?? null,
    treatmentStarted: treatment?.date ?? null,
  }
}

module.exports = { transformClinicalResponse }
