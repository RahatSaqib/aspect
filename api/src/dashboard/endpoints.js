const Joi = require('@hapi/joi')
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
  actionDashboard,
  operationalDataActivityOverTime,
  resultsTransmittedDashboard,
} = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/dashboard/summary',
    handler: asyncHandler(summaryDashboard),
    config: {
      description: 'Summary Dashboard',
      notes: 'The top level summary dashboard',
      auth: { scope: ['site', 'device', 'dashboard', 'operationalData'] },
      validate: {
        query: {
          siteId: Joi.number().allow('').description('Filter for site ID'),
          dashboard: Joi.string()
            .allow('', null)
            .valid('home', 'operational')
            .description(
              'Dashboard token where requested data to be displayed'
            ),
        },
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
      auth: { scope: ['site', 'device', 'dashboard'] },
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
      auth: { scope: ['site', 'result', 'dashboard'] },
    },
  },
  {
    method: 'GET',
    path: '/dashboard/inventory-item',
    handler: asyncHandler(inventoryItemDashboard),
    config: {
      description: 'Consumable Dashboard',
      notes: 'The top level consumable dashboard',
      auth: { scope: ['site', 'consumable', 'dashboard'] },
    },
  },
  {
    method: 'GET',
    path: '/dashboard/device',
    handler: asyncHandler(deviceDashboard),
    config: {
      description: 'Device Dashboard',
      notes: 'The top level device dashboard',
      auth: { scope: ['site', 'device', 'dashboard'] },
    },
  },
  {
    method: 'GET',
    path: '/dashboard/site',
    handler: asyncHandler(siteDashboard),
    config: {
      description: 'Site Dashboard',
      notes: 'The top level site dashboard',
      auth: { scope: ['site', 'device', 'dashboard'] },
    },
  },
  {
    method: 'GET',
    path: '/dashboard/action',
    handler: asyncHandler(actionDashboard),
    config: {
      description: 'Action Data Dashboard',
      notes: 'List of action category with actions',
      auth: { scope: ['site', 'device', 'dashboard'] },
      validate: {
        query: {
          siteId: Joi.number().allow('').description('Filter for Site ID'),
          ...validateSortPageParams(
            'issueStatusSortOrder',
            'siteName',
            'deviceName',
            'message'
          ),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/dashboard/operational-data/activity-over-time',
    handler: asyncHandler(operationalDataActivityOverTime),
    config: {
      description: 'Device Activity Rate Over Time',
      notes:
        'Gets the number of devices grouped by activity category, by day, in the given date range',
      auth: { scope: ['site', 'device', 'dashboard'] },
      validate: {
        query: {
          minDate: Joi.date().iso().required().description('From Date'),
          maxDate: Joi.date().iso().required().description('To Date'),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool()
            .required()
            .description('False if there was some sort of error'),
          data: Joi.array()
            .required()
            .description(
              'List of days in the given date range along with activity category counts'
            )
            .items(
              Joi.object().keys({
                date: Joi.date().description(
                  'Day that the aggregations were calculated for'
                ),
                devicesActive: Joi.number().description(
                  'The number of devices that were active that day'
                ),
                devicesInactive: Joi.number().description(
                  'The number of devices that were inactive that day'
                ),
                devicesTotal: Joi.number().description(
                  'The total number of devices in the system as of that day'
                ),
                isWeekendOrHoliday: Joi.bool().description(
                  'Indicates whether the day is a weekend day or a holiday.'
                ),
              })
            ),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/dashboard/results-transmitted',
    handler: asyncHandler(resultsTransmittedDashboard),
    config: {
      description: 'Results Transmitted Graph',
      notes: 'Data for graph Results Transmitted',
      auth: { scope: ['site', 'result', 'dashboard'] },
      validate: {
        query: {
          currentMonth: Joi.date()
            .iso()
            .allow(null)
            .description(
              'Set "current" month to return data for this and previous month'
            ),
        },
      },
    },
  },
]

module.exports = { routes }
