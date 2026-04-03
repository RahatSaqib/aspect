const EQA_RESULT_TYPE_EXTERNAL_ID = 'EQA'
const PATIENT_RESULT_TYPE_EXTERNAL_ID = 'Patient'
/**
 * This plugin set the result type to EQA if PatientId matches PartnerData.excludePattern regular expression
 * @param {request} request
 */
async function excludeResult(context) {
  const { knex, partnerId } = context
  const payload = context.payload.result

  const { excludePattern } = await knex('Partner').where({ id: partnerId }).first('excludePattern')
  if (excludePattern) {
    /**
     * create regex object with case-insensitive flag
     */
    const re = new RegExp(excludePattern, 'i')
    const sampleId = payload?.sample?.id ?? ''
    const sampleId1 = payload?.data?.sampleId ?? ''
    const patientId = payload.data?.patientId ?? ''
    const patientId2 = payload.data?.patientId2 ?? ''
    const isEqaResult = re.test(sampleId) || re.test(sampleId1) || re.test(patientId) || re.test(patientId2)
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
