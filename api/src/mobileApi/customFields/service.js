const Boom = require('@hapi/boom')
const { pick } = require('lodash')
const { knex } = require('../../db')
const { getConstraints } = require('../../auth/constraints')
const { getCustomFields } = require('../../forms/service')

const CUSTOM_FIELD_PUBLIC_PROPS = [
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
]

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
  let deviceTypeId = null
  if (deviceTypeFilter) {
    const deviceTypeRow = await knex('DeviceType').where('externalId', deviceTypeFilter).first('id')
    if (!deviceTypeRow) {
      throw Boom.badRequest(`Unknown DeviceType.externalId: ${deviceTypeFilter}`)
    }
    deviceTypeId = deviceTypeRow.id
  }

  const {
    country: { id: countryId },
    partner: { id: partnerId },
  } = await getConstraints(request.auth.credentials)
  const formDefinitions = await getCustomFields(partnerId, deviceTypeId, countryId)

  const data = [
    {
      ...formDefinitions,
      fields: formDefinitions.fields.map(field => pick(field, CUSTOM_FIELD_PUBLIC_PROPS)),
    },
  ]

  return {
    ok: true,
    data,
  }
}

module.exports = {
  getCustomFieldsByExternalIds,
}
