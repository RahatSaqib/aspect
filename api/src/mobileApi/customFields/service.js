const Boom = require('@hapi/boom')
const { pick, sortBy } = require('lodash')
const { knex } = require('../../db')
const { getForms } = require('../../forms/service')

async function assertAssayExternalIdExists(externalId) {
  const assay = await knex('Assay').where('externalId', externalId).first('id')
  if (!assay) {
    throw Boom.badRequest(`Unknown Assay externalId: ${externalId}`)
  }
}

async function assertDeviceTypeExternalIdExists(externalId) {
  const deviceType = await knex('DeviceType').where('externalId', externalId).first('id')
  if (!deviceType) {
    throw Boom.badRequest(`Unknown Device Type externalId: ${externalId}`)
  }
}

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
  const { externalIds, assay, disease, deviceType } = request.query

  const assayFilter = typeof assay === 'string' && assay.length > 0 ? assay : null
  const deviceTypeFilter = typeof deviceType === 'string' && deviceType.length > 0 ? deviceType : null

  if (assayFilter) {
    await assertAssayExternalIdExists(assayFilter)
  }
  if (deviceTypeFilter) {
    await assertDeviceTypeExternalIdExists(deviceTypeFilter)
  }

  if (Array.isArray(externalIds) && externalIds.length > 0) {
    request.query.externalsId = externalIds
  }

  const formDefinitions = await getForms(request)

  let formsToSerialize
  if (Array.isArray(externalIds) && externalIds.length > 0) {
    formsToSerialize = externalIds.map(id => formDefinitions[id]).filter(Boolean)
  } else {
    formsToSerialize = sortBy(Object.values(formDefinitions), f => f.formDefinitionExternalId)
  }

  const diseaseFilter = typeof disease === 'string' && disease.length > 0 ? disease : null

  if (assayFilter || diseaseFilter || deviceTypeFilter) {
    formsToSerialize = formsToSerialize.filter(form => {
      if (assayFilter) {
        const hasAssay = form.assayExternalId != null
        if (hasAssay && form.assayExternalId !== assayFilter) {
          return false
        }
      }
      if (deviceTypeFilter) {
        const hasDeviceType = form.deviceTypeExternalId != null
        if (hasDeviceType && form.deviceTypeExternalId !== deviceTypeFilter) {
          return false
        }
      }
      if (diseaseFilter && form.diseaseExternalId !== diseaseFilter) {
        return false
      }
      return true
    })
  }

  return {
    ok: true,
    data: formsToSerialize.map(mapFormToCustomFieldsPayload),
  }
}

module.exports = {
  getCustomFieldsByExternalIds,
}
