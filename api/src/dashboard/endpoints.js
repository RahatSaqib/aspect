const Joi = require('@hapi/joi')
const { asyncHandler } = require('../routes')
const {
  summaryDashboard,
  inventoryItemDashboard,
  resultsTransmittedDashboard,
  activityOverTimeDashboard,
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
            .description('Dashboard token where requested data to be displayed'),
          country: Joi.string().allow('', null).description('User Country'),
        },
      },
      response: {
        schema: {
          ok: Joi.bool().required(),
          data: Joi.array().items(
            Joi.object().keys({
              id: Joi.number().integer().required(),
              title: Joi.string().max(255).required(),
              titleI18nKey: Joi.string().max(255).allow('', null),
              subTitle: Joi.string().max(255).allow('', null),
              subTitleI18nKey: Joi.string().max(255).allow('', null),
              link: Joi.string().max(500).allow('', null),
              externalId: Joi.string().max(500).required(),
              description: Joi.string().max(500).allow('', null),
              descriptionI18nKey: Joi.string().max(255).allow('', null),
              dashboards: Joi.string().max(2048).allow('', null),
              linkParams: Joi.string().max(255).allow('', null),
              percentage: Joi.string()
                .optional()
                .allow('', null)
                .description('returns the percetage with the format ##%'),
              options: Joi.alternatives().try(Joi.string(), Joi.object()).allow(null, ''),
              icon: Joi.string().max(50).allow('', null),
              statUnit: Joi.string().max(50).allow('', null),
              statUnitI18nKey: Joi.string().max(255).allow('', null),
              statStatus: Joi.string().max(255).allow('', null),
              statStatusI18nKey: Joi.string().max(255).allow('', null),
              extraUnit: Joi.string().max(50).allow('', null),
              extraUnitI18nKey: Joi.string().max(255).allow('', null),
              extraLabel: Joi.string().max(255).allow('', null),
              extraLabelI18nKey: Joi.string().max(255).allow('', null),
              dashboardWidgetId: Joi.number().integer().required(),
              count: Joi.alternatives().try(Joi.string().max(50), Joi.number()).required(),
              unit: Joi.alternatives().try(Joi.string().max(50), Joi.number()).allow(null, ''),
              extra: Joi.string().max(1024).allow('', null),
              alert: Joi.alternatives().try(Joi.string(), Joi.object()).allow(null, ''),
            })
          ),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/dashboard/inventory-item',
    handler: asyncHandler(inventoryItemDashboard),
    config: {
      description: 'Consumable Dashboard',
      notes: 'The top level consumable dashboard',
      auth: { scope: ['site', 'consumable', 'dashboard', 'inventory'] },
    },
  },
  {
    method: 'GET',
    path: '/dashboard/operational-data/activity-over-time',
    handler: asyncHandler(activityOverTimeDashboard),
    config: {
      description: 'Device Activity Rate Over Time',
      notes: 'Gets the number of devices grouped by activity category, by day, in the given date range',
      auth: { scope: ['site', 'device', 'dashboard'] },
      validate: {
        query: {
          minDate: Joi.string().pattern(REGEX_ISODATESTRING).required().description('From Date, inclusive'),
          maxDate: Joi.string().pattern(REGEX_ISODATESTRING).required().description('To Date, inclusive'),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.array()
            .required()
            .description('List of days in the given date range along with activity category counts')
            .items(
              Joi.object().keys({
                date: Joi.date().description('Day that the aggregations were calculated for'),
                devicesActive: Joi.number().description('The number of devices that were active that day'),
                devicesInactive: Joi.number().description('The number of devices that were inactive that day'),
                devicesTotal: Joi.number().description('The total number of devices in the system as of that day'),
                inactiveUnknown: Joi.number().description(
                  'The number of inactive "Unknown" devices in the system as of that day'
                ),
                inactiveNoTestsPerformed: Joi.number().description(
                  'The number of inactive "NoResultsReported" devices in the system as of that day'
                ),
                inactiveOutOfInventory: Joi.number().description(
                  'The number of inactive "OutOfInventory" devices in the system as of that day'
                ),
                inactiveDownForRepair: Joi.number().description(
                  'The number of inactive "DownForRepair" devices in the system as of that day'
                ),
                inactiveDecommissioned: Joi.number().description(
                  'The number of inactive "Decommissioned" devices in the system as of that day'
                ),
                isWeekendOrHoliday: Joi.bool().description('Indicates whether the day is a weekend day or a holiday.'),
                inactiveNoStaff: Joi.number().description(
                  'The number of inactive "No Staff" devices in the system as of that day'
                ),
                inactiveNoSamples: Joi.number().description(
                  'The number of inactive "No Samples" devices in the system as of that day'
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
]

module.exports = { routes }
