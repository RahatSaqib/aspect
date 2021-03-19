const _ = require('lodash')
const { getConstraints } = require('../auth/constraints')
const { knex, filterParams } = require('../db')
const formDictionary = require('./formsFileDictionary')

async function getForms(request) {
  const { auth, query } = request
  const {
    partner: { id: partnerId },
  } = await getConstraints(auth.credentials)
  const formQuery = getFormsBaseQuery(partnerId, query)
  const forms = {}
  // eslint-disable-next-line no-return-assign
  _.each(await formQuery, form => {
    forms[form.externalId] = {
      ...formDictionary[form.externalId],
      assayId: form.assayId,
      diseaseId: form.diseaseId,
      formTypeId: form.formTypeId,
    }
  })
  return forms
}
const getCustomFields = async (partnerId, deviceId) => {
  const formQuery = await getFormsBaseQuery(partnerId, {
    formTypeId: 'gxConnectForm',
  })
    .join('Disease as di', 'di.id', 'fd.diseaseId')
    .join('AssayType as assayType', 'di.id', 'assayType.diseaseId')
    .join('Assay as a', 'assayType.id', 'a.assayTypeid')
    .join('DeviceType as dt', 'a.devicetypeid', 'dt.id')
    .join('Device as d', 'd.deviceTypeId', 'dt.id')
    .where('d.id', deviceId)

  let forms = {}
  // eslint-disable-next-line no-return-assign
  _.each(formQuery, form => {
    const fields = _.map(formDictionary[form.externalId].fields, field => ({
      ...field,
      assayId: form.assayId,
      diseaseId: form.diseaseId,
    }))
    forms = _.merge(forms, { fields })
  })
  return forms
}
function getFormsBaseQuery(partnerId, query) {
  const queryForm = knex('FormType AS ft')
    .join('FormDefinition as fd', 'fd.formTypeId', 'ft.id')
    .join(
      'FormDefinitionSchema as fschema',
      'fd.formDefinitionSchemaId',
      'fschema.id'
    )
    .where('fd.partnerId', partnerId)
    .modify(filterParams, query, {
      assayId: 'fd.assayId',
      diseaseId: 'fd.diseaseId',
      externalsId: 'fd.externalId',
      formType: 'ft.externalId',
    })
    .select(
      'fd.externalId',
      'fd.assayId',
      'fd.diseaseId',
      'ft.externalId as formTypeId'
    )
  return queryForm
}
module.exports = {
  getForms,
  getCustomFields,
}
