const _ = require('lodash')

const { normalizePhoneNumber } = require('../../shared/phoneNormalization')
const { knex } = require('../../db')
const { createFormObject } = require('../../forms/service')

async function mapPayloadWithCustomFields(payload, countryCode, partnerId, assayId, diseaseId) {
  const queryForm = await knex('FormType AS ft')
    .join('FormDefinition as fd', 'fd.formTypeId', 'ft.id')
    .join('FormDefinitionSchema as fschema', 'fd.formDefinitionSchemaId', 'fschema.id')
    .where('fd.partnerId', partnerId)
    .modify(builder => {
      if (assayId) builder.whereNull('fd.assayId').orWhere('fd.assayId', assayId)
      if (diseaseId) builder.whereNull('fd.diseaseId').orWhere('fd.diseaseId', diseaseId)
    })
    .where('ft.externalId', 'gxConnectForm')
    .distinct(
      'fd.externalId',
      'fd.assayId',
      'fd.diseaseId',
      'ft.externalId as formTypeId',
      knex.raw("REPLACE(fschema.jsonSchemaFile, '.json', '') as jsonSchemaFileName")
    )

  const forms = createFormObject(queryForm)

  transformPayloadWithFormsDefinition(forms, payload, countryCode)
}

function transformPayloadWithFormsDefinition(forms, payload, countryCode) {
  _.each(_.keys(forms), formKey => {
    _.each(forms[formKey].fields, prop => {
      const { payloadOriginPath, payloadDestinationPath, fieldType } = prop
      if (payloadOriginPath) {
        let value = _.get(payload, payloadOriginPath)

        if (value) {
          if (_.includes(['patientCellphone', 'clinicianCellphone'], fieldType))
            value = normalizePhoneNumber(value, countryCode)
          if (payloadDestinationPath) {
            _.set(payload, payloadDestinationPath, value)
          }
        }
      }
    })
  })
}

module.exports = {
  mapPayloadWithCustomFields,
  transformPayloadWithFormsDefinition,
}
