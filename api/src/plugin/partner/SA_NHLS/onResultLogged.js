const _ = require('lodash')
const { resultUpdated } = require('../../../result/actions')
const { parseDateOrDefault } = require('../../../shared/date')

// check for error codes when a result is logged
async function onResultLogged({ resultId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ resultUpdated })
  return context.transact(async knex => {
    const now = new Date()
    const result = await knex('Result as r')
      .join('Sample as s', 'r.sampleId', 's.id')
      .where({ 'r.id': resultId })
      .first(
        'r.formData',
        'r.patientData',
        'r.endedOn',
        'r.sampleId',
        's.collectedOn'
      )
    if (result) {
      const { formData, patientData, endedOn, sampleId, collectedOn } = result
      const resultUpdates = {}
      const sampleUpdates = {}

      let formDataObject
      if (formData) {
        formDataObject = JSON.parse(formData)
      }
      let patientDataObject = {}
      if (patientData) {
        patientDataObject = JSON.parse(patientData)
      }
      if (formDataObject && !_.isEmpty(formDataObject)) {
        patientDataObject.id = formDataObject.patientId
        patientDataObject.firstName = formDataObject.nameOfPatient
        patientDataObject.surname = formDataObject.surnameOfPatient
        patientDataObject.ward = formDataObject.ward
        patientDataObject.hospitalNumber = formDataObject.hospitalNumber
        resultUpdates.patientData = JSON.stringify(patientDataObject)

        const formDataTimeInstrumentResulted = parseDateOrDefault(
          formDataObject.timeInstrumentResulted,
          endedOn
        )
        if (formDataTimeInstrumentResulted !== endedOn) {
          resultUpdates.endedOn = formDataTimeInstrumentResulted
        }

        const formDataTimeSampleTaken = parseDateOrDefault(
          formDataObject.timeSampleTaken,
          collectedOn
        )
        if (formDataTimeSampleTaken !== collectedOn && sampleId) {
          sampleUpdates.collectedOn = formDataTimeSampleTaken
        }
      }
      if (!_.isEmpty(resultUpdates)) {
        resultUpdates.updatedOn = now
        resultUpdates.updatedBy = null
        await knex('Result')
          .where('id', resultId)
          .update(resultUpdates)
      }
      if (!_.isEmpty(sampleUpdates)) {
        await knex('Sample')
          .where('id', sampleId)
          .update(sampleUpdates)
      }
    }
  })
}

module.exports = onResultLogged
