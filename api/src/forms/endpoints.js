const Joi = require('@hapi/joi')
const { asyncHandler } = require('../routes')
const { getForms } = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/get-forms',
    handler: asyncHandler(getForms),
    config: {
      description: 'retrieve a single or multiple forms by type, disease or externalid',
      notes: 'retrieve forms by type, disease or externalid',
      auth: { scope: ['case'] },
      validate: {
        query: {
          externalsId: Joi.array()
            .items(Joi.string().description('the external id of one form'))
            .description('the list of externalid as an array for filtering the specific form value'),
          formType: Joi.string().description('ExternalId of the form origin/type'),
          diseaseId: Joi.number().optional().description('Filter for disease ID'),
          assayId: Joi.number().optional().description('Filter for assay ID'),
        },
      },
      response: {
        options: {
          allowUnknown: true,
        },
        schema: Joi.object().min(0),
      },
    },
  },
]

module.exports = { routes }
