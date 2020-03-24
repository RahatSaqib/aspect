const _ = require('lodash')
const { resultUpdated } = require('../../../result/actions')
const { resultSourceToId } = require('../../../shared/dictionary')

async function onResultLogged(
  { resultId, deviceLogId, userId },
  { messageContext }
) {
  const context = messageContext.bindActionCreators({ resultUpdated })
  await updateCovidResultFromFormData(
    { resultId, deviceLogId, userId },
    { messageContext: context }
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
      .join('Device as d', 'r.deviceId', 'd.id')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('Sample as s', 'r.sampleId', 's.id')
      .join('ResultForm as rf', function() {
        this.on('a.id', 'rf.assayId').andOn('r.partnerId', 'rf.partnerId')
      })
      .where({ 'r.id': resultId })
      .first(
        'dt.externalId as resultDeviceTypeExternalId',
        'a.externalId as assayExternalId',
        'a.resultSourceId',
        'r.formData',
        'r.patientData',
        'rf.formSchema'
      )
    if (!result) {
      return
    }
    const {
      assayExternalId,
      resultSourceId,
      formData,
      patientData,
      formSchema,
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
    if (patientData) {
      patientDataObject = JSON.parse(patientData)
    }
    let formSchemaObject = {}
    if (formSchema) {
      formSchemaObject = JSON.parse(formSchema)
    }
    const enteredByHandResultSourceId = await resultSourceToId('EnteredByHand')
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
      resultSourceId === enteredByHandResultSourceId ||
      deviceLogCountFromDiagnosticDevice === 0
    if (canOverwriteDiagnosticDataByHand) {
      patientDataObject.id = formDataObject.caseId
    } else if (formDataObject.caseId) {
      patientDataObject.id = patientDataObject.id || formDataObject.caseId
    }
    patientDataObject.caseId = formDataObject.caseId
    const testReasonOptions =
      _.get(formSchemaObject, 'fields.testReason.control.options') || []
    patientDataObject.testReason =
      (
        testReasonOptions.find(testReasonOption =>
          _.isEqual(testReasonOption.value, formDataObject.testReason)
        ) || {}
      ).title || formDataObject.testReason
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
        genderOptions.find(genderOption =>
          _.isEqual(genderOption.value, formDataObject.gender)
        ) || {}
      ).title || formDataObject.gender
    resultUpdates.patientData = JSON.stringify(patientDataObject)
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
