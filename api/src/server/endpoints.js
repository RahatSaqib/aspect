const Joi = require('@hapi/joi')
const { asyncHandler } = require('../routes')
const { getServersByPartner } = require('./getServersByPartner')
const { triggerJob } = require('../scheduler/triggerJob')
const { getStatistics } = require('./getStatistics')
const { getVersion } = require('./getVersion')
const { getStatus } = require('./getStatus')
const { listJobs } = require('../scheduler/listJobs')
const { testSentryError } = require('./testSentryError')

const countryBase = {
  CountryId: Joi.number().integer().positive().required().description('Country Id'),
  Country: Joi.string().required().description('Country name'),
  A2: Joi.string().required().description('Country abbreviation'),
  A3: Joi.string().required().description('Country A3'),
}

const routes = [
  {
    method: 'GET',
    path: '/server',
    handler: asyncHandler(getServersByPartner),
    config: {
      description: 'Result of the servers registered on each partner',
      notes: 'gets the name and the url of the partners server',
      auth: false,
      validate: {},
      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          data: Joi.array()
            .allow(null)
            .items(
              Joi.object()
                .keys({
                  name: Joi.string().required().description('The name of the partner'),
                  serverUrl: Joi.string().allow(null).description('The server Url for the partner'),
                })
                .description('The server')
            ),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/server/stats',
    handler: asyncHandler(getStatistics),
    config: {
      description: 'Get statistics for graph on http://dstats.systemone.id',
      notes: 'Gets same structure as from func GetDeviceAdoptionStats() in GxAlert',
      auth: false,
      validate: {},
      response: {
        options: {
          allowUnknown: true,
        },
        schema: Joi.object()
          .keys({
            Countries: Joi.array()
              .required()
              .items(
                Joi.object().keys({
                  ...countryBase,
                  Date: Joi.string().required().description('Month date when first device was created'),
                  Total: Joi.number().integer().min(0).required().description('Total number of devices per country'),
                })
              )
              .description('The stat for each country'),
            Devices: Joi.array()
              .required()
              .items(
                Joi.object().keys({
                  ...countryBase,
                  Date: Joi.string().required().description('Month date when device was created'),
                  Total: Joi.number()
                    .integer()
                    .min(0)
                    .required()
                    .description('Total number of NEW devices per country-month'),
                })
              )
              .description('The stat for NEW devices per month'),
            Tests: Joi.array()
              .required()
              .items(
                Joi.object().keys({
                  ...countryBase,
                  Date: Joi.string().required().description('Month date of result'),
                  Total: Joi.number()
                    .integer()
                    .min(0)
                    .required()
                    .description('Total number of results per country-month'),
                })
              )
              .description('The stat for results per month'),
            Connectivity: Joi.array()
              .required()
              .items(
                Joi.object().keys({
                  ...countryBase,
                  Date: Joi.date().iso().required().description('lastPingOn of device, or latest result updatedOn'),
                  MaintenanceStatusId: Joi.number()
                    .integer()
                    .min(0)
                    .allow(null)
                    .description('MaintenanceStatusId of last maintenance, per device'),
                  MaintenanceReasonId: Joi.string().allow(null).description('i18nKey of last maintenance, per device'),
                })
              )
              .description('The stat for connectivity issues'),
            Notifications: Joi.array()
              .required()
              .items(
                Joi.object().keys({
                  ...countryBase,
                  Date: Joi.string().required().description('Month date of processed notifications'),
                  Total: Joi.number()
                    .integer()
                    .min(0)
                    .required()
                    .description('Total notifications processed per country-month'),
                  Email: Joi.number()
                    .integer()
                    .min(0)
                    .required()
                    .description(`Total notifications' emails sent out per country-month`),
                  Sms: Joi.number()
                    .integer()
                    .min(0)
                    .required()
                    .description(`Total notifications' sms's sent out per country-month`),
                })
              )
              .description('The stat for notifications per country-month'),
          })
          .required()
          .description('Data for graph on dstats.systemone.id'),
      },
    },
  },
  {
    method: 'GET',
    path: '/version',
    handler: asyncHandler(getVersion),
    config: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/server/status',
    handler: asyncHandler(getStatus),
    config: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/listjobs',
    handler: asyncHandler(listJobs),
    config: {
      auth: { scope: ['admin:edit'] },
      description: 'Returns a list of all scheduled Jobs',
    },
  },
  {
    method: 'POST',
    path: '/triggerjob/{jobName}',
    handler: triggerJob,
    config: {
      auth: { scope: ['admin:edit'] },
      description: 'Force to trigger a scheduled job',
      validate: {
        params: {
          jobName: Joi.string().description('JobName'),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/test-sentry-error',
    handler: asyncHandler(testSentryError),
    config: {
      auth: false,
    },
  },
]

module.exports = { routes }
