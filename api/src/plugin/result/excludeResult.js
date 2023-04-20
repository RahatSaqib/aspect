const EQA_RESULT_TYPE_EXTERNAL_ID = 'EQA'
const PATIENT_RESULT_TYPE_EXTERNAL_ID = 'Patient'
/**
 * This plugin set the result type to EQA if PatientId matches PartnerData.excludePattern regular expression
 * @param {request} request
 */
async function excludeResult(pluginContext) {
  const { knex, partnerId, payload } = pluginContext

  const { excludePattern } = await knex('Partner').where({ id: partnerId }).first('excludePattern')
  if (excludePattern) {
    const sampleId = payload?.sample?.id ?? ''
    const sampleId1 = payload?.data?.sampleId ?? ''
    const isEqaResult = sampleId.match(excludePattern) || sampleId1.match(excludePattern)
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
}

module.exports = excludeResult
