const _ = require('lodash')
const { getConstraints } = require('../auth/constraints')
const { knex, filterParams } = require('../db')
const formDictionary = require('./formsFileDictionary')

async function getForms(request) {
  const { auth, query } = request
  const {
    partner: { id: partnerId },
  } = await getConstraints(auth.credentials)
  const formQuery = getFormsBaseQuery(knex, partnerId, query)
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
const getCustomFields = async ({ knex, partnerId, deviceId }) => {
  const formQuery = getFormsBaseQuery(knex, partnerId, {
    formTypeId: 'gxConnectForm',
  })
    .join('Disease as di', 'di.id', 'ft.diseaseId')
    .join('AssayType as assayType', 'di.id', 'assayType.diseaseId')
    .join('Assay as a', 'assayType.id', 'a.assayTypeid')
    .join('DeviceType as dt', 'a.devicetypeid', 'dt.id')
    .join('Device AS d', 'd.deviceTypeId', 'dt.id')
    .where('d.id', deviceId)

  let forms = {}
  // eslint-disable-next-line no-return-assign
  _.each(await formQuery, form => {
    forms = _.merge(forms, formDictionary[form.externalId], {
      assayId: form.assayId,
      diseaseId: form.diseaseId,
    })
  })
  return forms
}
const getFormsBaseQuery = async (knex, partnerId, query) => {
  return knex('FormType AS ft')
    .innerJoin('FormDefinition as fd', 'fd.formTypeId', 'ft.id')
    .innerJoin(
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
}
module.exports = {
  getForms,
  getCustomFields,
}
