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
      ...formDictionary[form.jsonSchemaFileName],
      assayId: form.assayId,
      diseaseId: form.diseaseId,
      formTypeId: form.formTypeId,
    }
  })
  return forms
}
const getCustomFields = async (partnerId, deviceId) => {
  const formQuery = await getFormsBaseQuery(partnerId, {
    formType: 'gxConnectForm',
  })
    .join('Disease as di', 'di.id', 'fd.diseaseId')
    .join('AssayType as assayType', 'di.id', 'assayType.diseaseId')
    .join('Assay as a', 'assayType.id', 'a.assayTypeId')
    .join('DeviceType as dt', 'a.devicetypeid', 'dt.id')
    .join('Device as d', 'd.deviceTypeId', 'dt.id')
    .leftJoin('Assay as formAssay', 'fd.assayId', 'formAssay.id')
    .where('d.id', deviceId)
    .select(
      'd.customFieldsSentOn',
      knex.raw('GROUP_CONCAT(DISTINCT formAssay.externalId) AS assayExternalId')
    )
    .groupBy('fd.id', 'd.customFieldsSentOn')
  const { customFieldsSentOn } = _.maxBy(formQuery, elem => elem.customFieldsSentOn) || {}

  const hasAnyUpdate =
    !customFieldsSentOn ||
    !!formQuery.find(
      ({ jsonSchemaFileName }) => formDictionary[jsonSchemaFileName].updatedOn > customFieldsSentOn
    )

  let forms = { fields: [] }
  if (hasAnyUpdate) {
    _.each(formQuery, form => {
      const fields = _.map(formDictionary[form.jsonSchemaFileName].fields, field => ({
        ...field,
        assayExternalId: form.assayExternalId
          ? form.assayExternalId.split(',')
          : [],
        diseaseId: form.diseaseId,
      }))
      forms = { fields: _.concat(forms.fields, fields) }
    })
  }

  console.log(forms)

  return forms
}
function getFormsBaseQuery(partnerId, query) {
  console.log(partnerId)
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
    .distinct(
      'fd.externalId',
      'fd.assayId',
      'fd.diseaseId',
      'ft.externalId as formTypeId',
      knex.raw("REPLACE(fschema.jsonSchemaFile, '.json', '') as jsonSchemaFileName")
    )
  return queryForm
}
module.exports = {
  getForms,
  getCustomFields,
}
