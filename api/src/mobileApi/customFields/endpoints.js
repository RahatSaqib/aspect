const Joi = require('joi')
const customFieldsService = require('./service')
const { upsertCustomFields } = require('./upsertCustomFields')
const { listForms } = require('./listForms')
const { getFormDataByExternalId } = require('./getFormDataByExternalId')
const { asyncHandler } = require('../../routes')

const EXTERNAL_ID_MAX_LENGTH = 36

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

const routes = [
  {
    method: 'GET',
    path: '/v4/custom-fields/form-data',
    handler: asyncHandler(listForms),
    config: {
      description: 'List FormData records for the current user',
      notes: 'Returns FormData rows where createdBy equals the logged-in user id. Supports optional siteId filter.',
      auth: { scope: ['result:view'] },
      validate: {
        query: Joi.object({
          siteId: Joi.number().integer().positive().optional(),
        }),
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
          externalIds: Joi.array()
            .items(Joi.string())
            .single()
            .description('The external ids of the custom fields to retrieve')
            .required(),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/v4/custom-fields',
    handler: asyncHandler(upsertCustomFields),
    config: {
      description: 'Upsert custom fields for a sample into FormData',
      notes: 'Creates or updates FormData rows by externalId when present, otherwise by siteId and sampleExternalId.',
      auth: { scope: ['result:edit'] },
      validate: {
        payload: customFieldsPayloadValidation,
      },
    },
  },
]

module.exports = { routes }
