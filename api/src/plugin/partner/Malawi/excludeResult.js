const defaultExcludeResultPlugin = require('../../result/excludeResult')

const EQA_RESULT_TYPE_EXTERNAL_ID = 'EQA'
const PATIENT_RESULT_TYPE_EXTERNAL_ID = 'Patient'

async function excludeResult(context) {
  const payload = context.payload.result
  setResultTypeIfIsEqa(payload)
  // calling the default behaviour, so all countries can use `Partner.excludePattern` regex to exclude results
  defaultExcludeResultPlugin(context)
}

/**
 * Set result type to EQA if result is EQA or PT, checking the custom field utilized by Malawi for this purpose.
 * @param {*} payload - Result payload
 */
function setResultTypeIfIsEqa(payload) {
  const EqaResultTypeExternalIds = [EQA_RESULT_TYPE_EXTERNAL_ID, 'PT']
  const tbType = payload.data?.customFieldData?.[7]?.value
  const hivType = payload.data?.customFieldData?.[34]?.value

  const isEqaResult = EqaResultTypeExternalIds.includes(hivType) || EqaResultTypeExternalIds.includes(tbType)

  const newResultTypeId = isEqaResult ? EQA_RESULT_TYPE_EXTERNAL_ID : PATIENT_RESULT_TYPE_EXTERNAL_ID

  const shouldUpdateResultType =
    newResultTypeId === EQA_RESULT_TYPE_EXTERNAL_ID ||
    !payload.type?.id ||
    payload.type.id === PATIENT_RESULT_TYPE_EXTERNAL_ID

  if (shouldUpdateResultType) {
    payload.type = {
      ...payload.type,
      ...{ id: newResultTypeId },
    }
  }
}

module.exports = excludeResult
