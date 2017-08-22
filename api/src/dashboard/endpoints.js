const Joi = require('joi')
const { asyncHandler } = require('../routes')
const { statusDashboard, operationalDashboard } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/dashboard',
    handler: asyncHandler(statusDashboard),
    config: {
      description: 'Status Dashboard',
      notes: 'The top level dashboard status',
      auth: { scope: ['site', 'device'] },
    },
  },
  {
    method: 'GET',
    path: '/dashboard/operational',
    handler: asyncHandler(operationalDashboard),
    config: {
      description: 'Operational Data Dashboard',
      notes: 'The top level operational data',
      auth: { scope: ['site', 'device'] },
      validate: {
        query: Object.assign({
          assayType: Joi.string()
            .allow('')
            .description('Filter for assay type'),
          dateRange: Joi.number()
            .allow('')
            .description('Filter for date range'),
        }),
      },
    },
  },
]
