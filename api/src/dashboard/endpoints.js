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
  resultsTransmittedDashboard,
  activityOverTimeDashboard,
  reportersDashboard,
} = require('./service')

const { REGEX_ISODATESTRING } = require('../shared/date')

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
    handler: asyncHandler(activityOverTimeDashboard),
    config: {
      description: 'Device Activity Rate Over Time',
      notes:
        'Gets the number of devices grouped by activity category, by day, in the given date range',
      auth: { scope: ['site', 'device', 'dashboard'] },
      validate: {
        query: {
          minDate: Joi.date()
            .iso()
            .required()
            .description('From Date, inclusive'),
          maxDate: Joi.date()
            .iso()
            .required()
            .description('To Date, inclusive'),
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
                inactiveUnknown: Joi.number().description(
                  'The number of inactive "Unknown" devices in the system as of that day'
                ),
                inactiveNoResultsReported: Joi.number().description(
                  'The number of inactive "NoResultsReported" devices in the system as of that day'
                ),
                inactiveOutOfInventory: Joi.number().description(
                  'The number of inactive "OutOfInventory" devices in the system as of that day'
                ),
                inactiveDownForRepair: Joi.number().description(
                  'The number of inactive "DownForRepair" devices in the system as of that day'
                ),
                inactiveConnectivity: Joi.number().description(
                  'The number of inactive "Connectivity" devices in the system as of that day'
                ),
                inactiveDecommissioned: Joi.number().description(
                  'The number of inactive "Decommissioned" devices in the system as of that day'
                ),
                isWeekendOrHoliday: Joi.bool().description(
                  'Indicates whether the day is a weekend day or a holiday.'
                ),
                inactiveNoStaff: Joi.number().description(
                  'The number of inactive "No Staff" devices in the system as of that day'
                ),
                inactiveNoPower: Joi.number().description(
                  'The number of inactive "No Power" devices in the system as of that day'
                ),
                inactiveOther: Joi.number().description(
                  'The number of inactive "Other" devices in the system as of that day'
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
          currentMonth: Joi.string()
            .pattern(REGEX_ISODATESTRING)
            .allow(null)
            .description(
              'Set "current" month to return data for this and previous month with the next format 2020-11-26T15:00:24.317-03:00'
            ),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/dashboard/site-reporters',
    handler: asyncHandler(reportersDashboard),
    config: {
      description: 'Sites with for Reporter Dashboard',
      notes: `List of sites with some aggregations about reporters`,
      auth: { scope: ['site', 'reporter', 'dashboard'] },
      validate: {
        query: {
          minDate: Joi.date()
            .iso()
            .required()
            .description('From Date, inclusive'),
          maxDate: Joi.date()
            .iso()
            .required()
            .description('To Date, inclusive'),
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
            .description('List of site with statistics on reporters')
            .items(
              Joi.object().keys({
                siteId: Joi.number().description('Partner Id'),
                siteName: Joi.string().description('Site name'),
                siteShortName: Joi.string().description('Site short name'),
                partnerId: Joi.number().description('Partner Id'),
                countryId: Joi.number().description('Country Id'),
                stateId: Joi.number().allow(null).description('State Id'),
                stateName: Joi.string()
                  .allow('', null)
                  .description('State name'),
                lgaId: Joi.number().allow(null).description('Lga Id'),
                lgaName: Joi.string().allow('', null).description('Lga name'),
                totalResults: Joi.number().description(
                  'The number of results where the reportable site is the clinic'
                ),
                delivered: Joi.number().description(
                  'The number of those results that were delivered to any Reporter'
                ),
                requiresTreatment: Joi.number().description(
                  'The number of delivered results that require treatment'
                ),
                onTreatment: Joi.number().description(
                  'The number of delivered results on treatment'
                ),
                notPossible: Joi.number().description(
                  'The number of results where "Not Possible" was selected for treatment'
                ),
                notOnTreatment: Joi.number().description(
                  `The number of results that require treatment, but that weren't put on treatment yet (not including "Not Possible" in this count)`
                ),
                transferred: Joi.number().description(
                  'The number of delivered results that were transferred to another clinic'
                ),
              })
            ),
        }),
      },
    },
  },
]

module.exports = { routes }
