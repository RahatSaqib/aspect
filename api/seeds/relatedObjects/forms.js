const _ = require('lodash')
const Promise = require('bluebird')
const { formTypeToId, diseaseToId, allAssayToId } = require('../../src/shared/dictionary')
const forms = require('../fixtures/forms')

async function getBaseForms() {
  const assaysIds = await allAssayToId()
  const newFormsObject = {}
  await Promise.each(Object.keys(forms), async form => {
    newFormsObject[form] = _.omit(forms[form], [
      'formDefinition.formTypeExternalId',
      'formDefinition.diseaseExternalId',
      'formDefinition.assayExternalId',
    ])
    if (forms[form].formDefinition.diseaseExternalId)
      newFormsObject[form].formDefinition.diseaseId = await diseaseToId(forms[form].formDefinition.diseaseExternalId)

    if (forms[form].formDefinition.assayExternalId) {
      newFormsObject[form].formDefinition.assayId = assaysIds[forms[form].formDefinition.assayExternalId]
    }
    if (forms[form].formDefinition.formTypeExternalId)
      newFormsObject[form].formDefinition.formTypeId = await formTypeToId(forms[form].formDefinition.formTypeExternalId)
  })
  return newFormsObject
}

module.exports = {
  getBaseForms,
}
