const Joi = require('joi')
const customFieldsService = require('./service')
const { asyncHandler } = require('../../routes')

const routes = [
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
]

module.exports = { routes }
