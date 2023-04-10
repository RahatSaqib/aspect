async function preProcessMergeResult({ payload }) {
  setResultTypeIfIsEqa(payload)
}

/**
 * Set result type to EQA if result is EQA or PT
 * @param {*} payload - Result payload
 */
function setResultTypeIfIsEqa(payload) {
  const eqaResultTypeExternalId = 'EQA'
  const patientExternalId = 'Patient'

  const testResultTypeExternalIds = [eqaResultTypeExternalId, 'PT']
  const tbType = payload.result?.data?.customFieldData?.[7]?.value
  const hivType = payload.result?.data?.customFieldData?.[34]?.value

  const isTestResult = testResultTypeExternalIds.includes(hivType) || testResultTypeExternalIds.includes(tbType)

  if (!payload.result.type) {
    payload.result.type = {}
  }

  payload.result.type.id = isTestResult ? eqaResultTypeExternalId : patientExternalId
}

module.exports = preProcessMergeResult
