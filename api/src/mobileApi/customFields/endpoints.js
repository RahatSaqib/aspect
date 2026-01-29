const Joi = require('joi')
const customFieldsService = require('./service')
const { upsertCustomFields } = require('./upsertCustomFields')
const { listForms } = require('./listForms')
const { asyncHandler } = require('../../routes')

const customFieldsPayloadValidation = Joi.object({
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
      notes: 'Returns FormData rows where createdBy equals the logged-in user id. No query params.',
      auth: { scope: ['result:view'] },
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
      notes: 'Creates or updates FormData rows by siteId, sampleExternalId and formDefinitionExternalId',
      auth: { scope: ['result:edit'] },
      validate: {
        payload: customFieldsPayloadValidation,
      },
    },
  },
]

module.exports = { routes }
