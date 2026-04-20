const Joi = require('@hapi/joi')
const customFieldsService = require('./service')
const { upsertFormData } = require('./upsertFormData')
const { listForms } = require('./listForms')
const { getFormDataByExternalId } = require('./getFormDataByExternalId')
const { asyncHandler } = require('../../routes')

const EXTERNAL_ID_MAX_LENGTH = 36

const optionalQueryStringList = description =>
  Joi.array().items(Joi.string()).single().optional().description(description)

/** Single Assay.externalId / Disease.externalId / DeviceType.externalId filter; omit or empty = no filter. */
const optionalSingleExternalFilter = description =>
  Joi.string().trim().allow('').max(120).optional().description(description)

const customFieldsPayloadValidation = Joi.object({
  externalId: Joi.string().allow(null, '').max(EXTERNAL_ID_MAX_LENGTH),
  sampleExternalId: Joi.string().allow(null, '').max(80).required(),
  collectedOn: Joi.date().iso().allow(null, ''),
  originSiteId: Joi.number().integer().required(),
  customFieldsData: Joi.array()
    .items(
      Joi.object({
        formDefinitionExternalId: Joi.string().required(),
        fields: Joi.object().unknown(true).default({}),
      })
    )
    .min(1)
    .required(),
})

const listFormDataResponseValidation = Joi.object({
  ok: Joi.boolean().valid(true).required(),
  data: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().integer().required(),
        siteId: Joi.number().integer().required(),
        resultId: Joi.number().integer().allow(null).required(),
        resultEndedOn: Joi.date().iso().allow(null),
        sampleExternalId: Joi.string().allow(null, ''),
        externalId: Joi.string().allow(null, '').max(EXTERNAL_ID_MAX_LENGTH),
        collectedOn: Joi.date().iso().allow(null, ''),
      }).unknown(true)
    )
    .required(),
})

const routes = [
  {
    method: 'GET',
    path: '/v4/custom-fields/form-data',
    handler: asyncHandler(listForms),
    config: {
      description: 'List FormData records for the current user',
      notes:
        'Returns FormData rows where createdBy equals the logged-in user id. Supports optional siteId and modifiedDays filters.',
      auth: { scope: ['result:view'] },
      validate: {
        query: Joi.object({
          siteId: Joi.number().integer().positive().optional(),
          modifiedDays: Joi.number().integer().positive().optional(),
        }),
      },
      response: {
        options: { allowUnknown: false },
        schema: listFormDataResponseValidation,
      },
    },
  },
  {
    method: 'GET',
    path: '/v4/custom-fields/{externalId}',
    handler: asyncHandler(getFormDataByExternalId),
    config: {
      description: 'Get a FormData record by externalId',
      notes: 'Returns a single FormData row visible to the current user for the provided externalId.',
      auth: { scope: ['result:view'] },
      validate: {
        params: Joi.object({
          externalId: Joi.string().max(EXTERNAL_ID_MAX_LENGTH).required(),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/v4/custom-fields',
    handler: asyncHandler(customFieldsService.getCustomFieldsByExternalIds),
    config: {
      description: 'Endpoint for retrieving custom fields',
      notes: 'Used for syncing the Aspect mobile the endpoint allows users to fetch the latest custom fields',
      auth: { scope: ['result:view'] },
      validate: {
        query: Joi.object({
          deviceType: optionalSingleExternalFilter(
            'Optional DeviceType.externalId: general forms (no device type on assay) are always included; otherwise only if they match this value.'
          ),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/v4/custom-fields',
    handler: asyncHandler(upsertFormData),
    config: {
      description: 'Upsert FormData (custom fields) for a sample',
      notes: 'Creates or updates FormData rows by externalId when present, otherwise by siteId and sampleExternalId.',
      auth: { scope: ['result:edit'] },
      validate: {
        payload: customFieldsPayloadValidation,
      },
    },
  },
]

module.exports = { routes }
