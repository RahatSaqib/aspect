const _ = require('lodash')
const { resultUpdated } = require('../../../result/actions')
const { resultSourceToId } = require('../../../shared/dictionary')

async function onResultLogged(
  { resultId, deviceLogId, userId },
  { messageContext }
) {
  const context = messageContext.bindActionCreators({ resultUpdated })
  return context.transact(async knex => {
    const now = new Date()
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
    if (result) {
      const {
        assayExternalId,
        resultSourceId,
        formData,
        patientData,
        formSchema,
      } = result
      const resultUpdates = {}

      let formDataObject
      if (formData) {
        formDataObject = JSON.parse(formData)
      }
      let patientDataObject = {}
      if (patientData) {
        patientDataObject = JSON.parse(patientData)
      }
      let formSchemaObject = {}
      if (formSchema) {
        formSchemaObject = JSON.parse(formSchema)
      }
      if (
        formDataObject &&
        !_.isEmpty(formDataObject) &&
        [
          'assayPCRCovid19',
          'assayMP96Covid19',
          'assayQS7Covid19',
          'assayGXCovid19',
        ].includes(assayExternalId)
      ) {
        if (deviceLogDeviceTypeExternalId === 'Aspect') {
          const enteredByHandResultSourceId = await resultSourceToId(
            'EnteredByHand'
          )
          if (resultSourceId === enteredByHandResultSourceId) {
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
          patientDataObject.age = formDataObject.age
          const genderOptions =
            _.get(formSchemaObject, 'fields.gender.control.options') || []
          patientDataObject.gender =
            (
              genderOptions.find(genderOption =>
                _.isEqual(genderOption.value, formDataObject.gender)
              ) || {}
            ).title || formDataObject.gender
          resultUpdates.patientData = JSON.stringify(patientDataObject)
        }
      }
      if (!_.isEmpty(resultUpdates)) {
        resultUpdates.updatedOn = now
        resultUpdates.updatedBy = userId
        await knex('Result')
          .where('id', resultId)
          .update(resultUpdates)
      }
    }
  })
}

module.exports = onResultLogged
