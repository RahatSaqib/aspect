const Joi = require('@hapi/joi')
const { asyncHandler } = require('../routes')
const { listFormDataEntries, showFormDataEntry } = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/form-data',
    handler: asyncHandler(listFormDataEntries),
    config: {
      description: 'FormData list',
      notes: 'Lists custom field entries constrained by the user result access.',
      auth: { scope: ['forms:view'] },
      validate: {
        query: Joi.object({
          siteId: Joi.number().integer().positive().optional(),
          dateFrom: Joi.date().iso().optional(),
          dateTo: Joi.date().iso().optional(),
          sampleExternalId: Joi.string().trim().optional(),
          matched: Joi.boolean().truthy('true').falsy('false').optional(),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/form-data/{id}',
    handler: asyncHandler(showFormDataEntry),
    config: {
      description: 'FormData detail',
      notes: 'Returns a single custom field entry constrained by user result access.',
      auth: { scope: ['forms:view'] },
      validate: {
        params: Joi.object({
          id: Joi.number().integer().positive().required(),
        }),
      },
    },
  },
]

module.exports = { routes }
