const _ = require('lodash')
const { resultUpdated } = require('../../../result/actions')

async function onResultUpdated({ resultId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ resultUpdated })
  return context.transact(async knex => {
    const now = new Date()
    const result = await knex('Result as r')
      .join('Sample as s', 'r.sampleId', 's.id')
      .where({ 'r.id': resultId })
      .first('r.formData', 'r.patientData')
    if (result) {
      const { formData, patientData } = result
      const resultUpdates = {}

      let formDataObject
      if (formData) {
        formDataObject = JSON.parse(formData)
      }
      let patientDataObject = {}
      if (patientData) {
        patientDataObject = JSON.parse(patientData)
      }
      if (formDataObject && !_.isEmpty(formDataObject)) {
        patientDataObject.id = patientDataObject.id || formDataObject.caseId
        patientDataObject.caseId = formDataObject.caseId
        patientDataObject.testReason = formDataObject.testReason
        patientDataObject.age = formDataObject.age
        patientDataObject.gender = formDataObject.gender
        resultUpdates.patientData = JSON.stringify(patientDataObject)
      }
      if (!_.isEmpty(resultUpdates)) {
        resultUpdates.updatedOn = now
        resultUpdates.updatedBy = null
        await knex('Result')
          .where('id', resultId)
          .update(resultUpdates)
      }
    }
  })
}

module.exports = onResultUpdated
