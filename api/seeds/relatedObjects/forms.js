const _ = require('lodash')
const { formTypeToId, diseaseToId } = require('../../src/shared/dictionary')
const forms = require('../fixtures/forms')

async function getBaseForms() {
  const newFormsObject = {}
  // Issues
  _.each(Object.keys(forms), async form => {
    newFormsObject[form] = _.omit(forms[form], [
      'formDefinition.formTypeExternalId',
      'formDefinition.diseaseExternalId',
    ])

    newFormsObject[form].formDefinition.diseaseId = await diseaseToId(
      forms[form].formDefinition.diseaseExternalId
    )
    newFormsObject[form].formDefinition.formTypeId = await formTypeToId(
      forms[form].formDefinition.formTypeExternalId
    )
  })
  return newFormsObject
}

module.exports = {
  getBaseForms,
}
