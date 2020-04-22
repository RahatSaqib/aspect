const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const {
  validateAllGeographyFilterParams,
} = require('../geography/requestValidation')
const { getCases } = require('./proxies')

const routes = [
  {
    method: 'GET',
    path: '/case',
    handler: asyncHandler(getCases),
    config: {
      description: 'Result List',
      notes: 'Pageable and sortable list of results',
      auth: { scope: ['result'] },
      timeout: {
        server: 360000,
        socket: false,
      },
      validate: {
        query: {
          patientOrResearchId: Joi.string()
            .allow('')
            .description('Filter for patient/research ID'),
          sampleOriginSite: Joi.string()
            .allow('')
            .description('Filter for sample origin site ID'),
          diseaseId: Joi.string()
            .allow('')
            .description('Filter for disease ID'),
          ...validateAllGeographyFilterParams(),
          ...validateSortPageParams(),
        },
      },
    },
  },
]

module.exports = { routes }
