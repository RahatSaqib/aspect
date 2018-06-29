const Joi = require('joi')
const {
  asyncHandler,
  validateDateRangeParams,
  validateSortPageParams,
} = require('../routes')
const {
  summaryDashboard,
  targetDashboard,
  resultDashboard,
  inventoryItemDashboard,
  deviceDashboard,
  siteDashboard,
  operationalDashboard,
  actionDashboard,
} = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/dashboard/summary',
    handler: asyncHandler(summaryDashboard),
    config: {
      description: 'Summary Dashboard',
      notes: 'The top level summary dashboard',
      auth: { scope: ['site', 'device'] },
      validate: {
        query: Object.assign({
          siteId: Joi.number()
            .allow('')
            .description('Filter for site ID'),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/dashboard/target',
    handler: asyncHandler(targetDashboard),
    config: {
      description: 'Target Dashboard',
      notes: 'The top level target dashboard',
      auth: { scope: ['site', 'device'] },
      validate: {
        query: Object.assign(validateDateRangeParams()),
      },
    },
  },
  {
    method: 'GET',
    path: '/dashboard/result',
    handler: asyncHandler(resultDashboard),
    config: {
      description: 'Result Dashboard',
      notes: 'The top level result dashboard',
      auth: { scope: ['site', 'result'] },
    },
  },
  {
    method: 'GET',
    path: '/dashboard/inventory-item',
    handler: asyncHandler(inventoryItemDashboard),
    config: {
      description: 'Consumable Dashboard',
      notes: 'The top level consumable dashboard',
      auth: { scope: ['site', 'consumable'] },
    },
  },
  {
    method: 'GET',
    path: '/dashboard/device',
    handler: asyncHandler(deviceDashboard),
    config: {
      description: 'Device Dashboard',
      notes: 'The top level device dashboard',
      auth: { scope: ['site', 'device'] },
    },
  },
  {
    method: 'GET',
    path: '/dashboard/site',
    handler: asyncHandler(siteDashboard),
    config: {
      description: 'Site Dashboard',
      notes: 'The top level site dashboard',
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
  {
    method: 'GET',
    path: '/dashboard/action',
    handler: asyncHandler(actionDashboard),
    config: {
      description: 'Action Data Dashboard',
      notes: 'List of action category with actions',
      auth: { scope: ['site', 'device'] },
      validate: {
        query: Object.assign(
          {
            siteId: Joi.number()
              .allow('')
              .description('Filter for Site ID'),
          },
          validateSortPageParams('issueStatusSortOrder', 'siteName', 'message')
        ),
      },
    },
  },
]

module.exports = { routes }
