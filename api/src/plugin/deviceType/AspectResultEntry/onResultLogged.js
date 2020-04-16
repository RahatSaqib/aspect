const _ = require('lodash')
const {
  resultCategoryToId,
  resultSourceToId,
} = require('../../../shared/dictionary')
const { parseDateOrDefault } = require('../../../shared/date')

async function onResultLogged(
  { resultId, deviceLogId, userId },
  { messageContext }
) {
  await updateCovidResultFromFormData(
    { resultId, deviceLogId, userId },
    { messageContext }
  )
}

async function updateCovidResultFromFormData(
  { resultId, deviceLogId, userId },
  { messageContext }
) {
  return messageContext.transact(async knex => {
    const { externalId: deviceLogDeviceTypeExternalId } =
      (await knex('DeviceLog as dl')
        .join('Device as d', 'dl.deviceId', 'd.id')
        .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .where(function() {
          if (deviceLogId) {
            this.where('dl.id', deviceLogId)
          } else {
            this.where('dl.resultId', resultId)
          }
        })
        .orderBy('dl.id', 'desc')
        .first('dt.externalId')) || {}
    if (deviceLogDeviceTypeExternalId !== 'Aspect') {
      return
    }
    const result = await knex('Result as r')
      .join('Assay as a', 'r.assayId', 'a.id')
      .join('AssayType as at', 'a.assayTypeId', 'at.id')
      .join('Device as d', 'r.deviceId', 'd.id')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('Sample as s', 'r.sampleId', 's.id')
      .join('ResultForm as rf', function() {
        this.on('a.id', 'rf.assayId').andOn('r.partnerId', 'rf.partnerId')
      })
      .leftJoin('PartnerDisease as pd', function() {
        this.on('at.diseaseId', 'pd.diseaseId').andOn(
          'r.partnerId',
          'pd.partnerId'
        )
      })
      .where({ 'r.id': resultId })
      .first(
        'dt.externalId as resultDeviceTypeExternalId',
        'a.externalId as assayExternalId',
        'a.resultSourceId',
        'r.formData',
        'r.patientData',
        'r.resultData',
        'rf.formSchema',
        'r.resultCategory1',
        'r.startedOn',
        'r.endedOn',
        'pd.canAutoAssignResultByCaseId'
      )
    if (!result) {
      return
    }
    const {
      assayExternalId,
      formData,
      resultData,
      patientData,
      formSchema,
      resultCategory1,
      startedOn,
      endedOn,
      canAutoAssignResultByCaseId,
    } = result
    const covid19AssayExternalIds = await knex('AssayType as at')
      .join('Assay as a', 'at.id', 'a.assayTypeId')
      .where('at.externalId', 'covid19')
      .pluck('a.externalId')
    if (!covid19AssayExternalIds.includes(assayExternalId)) {
      return
    }
    const resultUpdates = {}
    let formDataObject
    if (formData) {
      formDataObject = JSON.parse(formData)
    }
    if (_.isEmpty(formDataObject)) {
      return
    }
    let patientDataObject = {}
    let originalPatientDataObject = {}
    if (patientData) {
      patientDataObject = JSON.parse(patientData)
      originalPatientDataObject = JSON.parse(patientData)
    }
    let resultDataObject = {}
    let originalResultDataObject = {}
    if (resultData) {
      resultDataObject = JSON.parse(resultData)
      originalResultDataObject = JSON.parse(resultData)
    }
    let formSchemaObject = {}
    if (formSchema) {
      formSchemaObject = JSON.parse(formSchema)
    }
    const diagnosticDeviceResoultSourceId = await resultSourceToId(
      'DiagnosticDevice'
    )
    const [{ deviceLogCountFromDiagnosticDevice }] = await knex(
      'DeviceLog as dl'
    )
      .join('Device as d', 'dl.deviceId', 'd.id')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('Assay as a', 'dt.id', 'a.deviceTypeId')
      .where('dl.resultId', resultId)
      .andWhere('a.resultSourceId', diagnosticDeviceResoultSourceId)
      .count('dl.id as deviceLogCountFromDiagnosticDevice')
    const canOverwriteDiagnosticDataByHand =
      deviceLogCountFromDiagnosticDevice === 0

    const caseExternalId = formDataObject.caseId
    if (canAutoAssignResultByCaseId && caseExternalId) {
      const [caseId] = await knex('Case')
        .where('externalId', caseExternalId)
        .pluck('id')
      if (!caseId) {
        // TODO: auto create entry in table Case - check if needed
      }
      resultUpdates.caseId = caseId || null
    }
    patientDataObject.caseId = caseExternalId
    if (canOverwriteDiagnosticDataByHand) {
      patientDataObject.id = caseExternalId
    } else if (caseExternalId) {
      patientDataObject.id = patientDataObject.id || caseExternalId
    }

    const testReasonOptions =
      _.get(formSchemaObject, 'fields.testReason.control.options') || []
    patientDataObject.testReason =
      (
        testReasonOptions.find(
          option => option.value == formDataObject.testReason // eslint-disable-line eqeqeq
        ) || {}
      ).title ||
      formDataObject.testReasonOther ||
      patientDataObject.testReason
    patientDataObject.age =
      formDataObject.age ||
      (formDataObject.ageYears ? `${formDataObject.ageYears} years` : null) ||
      (formDataObject.ageMonths
        ? `${formDataObject.ageMonths} months`
        : null) ||
      (formDataObject.ageDays ? `${formDataObject.ageDays} days` : null)
    const genderOptions =
      _.get(formSchemaObject, 'fields.gender.control.options') || []
    patientDataObject.gender =
      (
        genderOptions.find(
          option => option.value == formDataObject.gender // eslint-disable-line eqeqeq
        ) || {}
      ).title || patientDataObject.gender
    if (!_.isEqual(patientDataObject, originalPatientDataObject)) {
      resultUpdates.patientData = JSON.stringify(patientDataObject)
    }
    const testResultOptions =
      _.get(formSchemaObject, 'fields.testResult.control.options') || []
    const selectedResultText = (
      testResultOptions.find(
        option => option.value == formDataObject.testResult // eslint-disable-line eqeqeq
      ) || {}
    ).title
    let testDate
    if (formDataObject.dateAndTimeOfTest) {
      testDate = parseDateOrDefault(formDataObject.dateAndTimeOfTest)
    }
    if (canOverwriteDiagnosticDataByHand) {
      resultDataObject.resultText =
        selectedResultText || resultDataObject.resultText
      if (testDate) {
        resultUpdates.endedOn = testDate || endedOn
        resultUpdates.startedOn = testDate || startedOn
      }
    } else if (selectedResultText) {
      resultDataObject.resultText =
        resultDataObject.resultText || selectedResultText
      if (
        resultDataObject.resultText === 'Unknown' &&
        selectedResultText !== 'Unknown'
      ) {
        resultDataObject.resultText = selectedResultText
      }
      if (testDate) {
        resultUpdates.endedOn = endedOn || testDate
        resultUpdates.startedOn = startedOn || testDate
      }
    }
    if (assayExternalId === 'assayGenericCovid19') {
      const testTypeOptions =
        _.get(formSchemaObject, 'fields.testType.control.options') || []
      const selectedTestType = (
        testTypeOptions.find(
          option => option.value == formDataObject.testType // eslint-disable-line eqeqeq
        ) || {}
      ).title
      resultDataObject.typeOfTest =
        selectedTestType || resultDataObject.typeOfTest
    }
    if (!_.isEqual(resultDataObject, originalResultDataObject)) {
      if (resultDataObject.resultText) {
        const resultCategoryId = await resultCategoryToId(
          resultDataObject.resultText
        )
        if (resultCategoryId && resultCategoryId !== resultCategory1) {
          resultUpdates.resultCategory1 = resultCategoryId
        }
      }
      resultUpdates.resultData = JSON.stringify(resultDataObject)
    }
    if (_.isEmpty(resultUpdates)) {
      return
    }
    const now = new Date()
    resultUpdates.updatedOn = now
    resultUpdates.updatedBy = userId
    await knex('Result')
      .where('id', resultId)
      .update(resultUpdates)
  })
}

module.exports = onResultLogged
