const Boom = require('@hapi/boom')
const { pick, sortBy } = require('lodash')
const { knex } = require('../../db')
const { getConstraints } = require('../../auth/constraints')
const { getCustomFields } = require('../../forms/service')

function mapFormToCustomFieldsPayload(form) {
  return {
    formDefinitionExternalId: form.formDefinitionExternalId,
    assayExternalId: form.assayExternalId,
    diseaseExternalId: form.diseaseExternalId,
    deviceTypeExternalId: form.deviceTypeExternalId,
    fields: form.fields.map(field =>
      pick(field, [
        'id',
        'name',
        'title',
        'fieldType',
        'order',
        'controlType',
        'mandatory',
        'validation',
        'condition',
        'items',
      ])
    ),
  }
}

/**
 * Get custom field form definitions for the partner.
 * When `externalIds` is provided and non-empty, returns only those definitions (in request order).
 * When omitted or empty, returns every form definition the partner has (same scope as getForms).
 * Optional query `disease`: only forms with that Disease.externalId (omit = no filter).
 * Optional `assay`: general forms (no assay) always kept; assay-scoped forms only if assay matches.
 *   Unknown Assay.externalId → 400 Bad Request.
 * Optional `deviceType`: same for DeviceType.externalId from the form assay (null = general).
 *   Unknown DeviceType.externalId → 400 Bad Request.
 */
async function getCustomFieldsByExternalIds(request) {
  const { deviceType } = request.query

  const deviceTypeFilter = typeof deviceType === 'string' && deviceType.length > 0 ? deviceType : null
  const { id: deviceTypeId } = deviceTypeFilter
    ? await knex('DeviceType').where('externalId', deviceTypeFilter).first('id')
    : null

  const {
    country: { id: countryId },
    partner: { id: partnerId },
  } = await getConstraints(request.auth.credentials)
  const formDefinitions = await getCustomFields(partnerId, deviceTypeId, countryId)

  // const formsToSerialize = s[...sortBy(Object.values(formDefinitions), f => f.formDefinitionExternalId)]

  return {
    ok: true,
    data: [formDefinitions],
  }
}

module.exports = {
  getCustomFieldsByExternalIds,
}
