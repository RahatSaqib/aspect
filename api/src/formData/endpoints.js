const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listFormDataEntries } = require('./listFormDataEntries')
const { showFormDataEntry } = require('./showFormDataEntry')

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
          minDate: Joi.date().iso().required(),
          maxDate: Joi.date().iso().required(),
          sampleExternalId: Joi.string().trim().optional(),
          matched: Joi.boolean().truthy('true').falsy('false').optional(),
          ...validateSortPageParams('sampleExternalId', 'siteName', 'collectedOn', 'resultEndedOn', 'createdOn'),
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
