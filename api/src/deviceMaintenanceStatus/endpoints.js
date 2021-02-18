const Joi = require('@hapi/joi')

const { asyncHandler } = require('../routes')
const { deviceStatusOverTime, update } = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/maintenance/over-time',
    handler: asyncHandler(deviceStatusOverTime),
    config: {
      description: 'Device Status Over Time',
      notes: 'List of devices and their status history over time',
      auth: { scope: ['device', 'operationalData'] },
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
          data: Joi.array().items(
            Joi.object().keys({
              id: Joi.number().required().description('The id of the device'),
              name: Joi.string()
                .required()
                .description('The name of the device'),
              shortName: Joi.string().description(
                'The short name of the device'
              ),
              longitude: Joi.number()
                .allow(null)
                .description('The longitude where the device is allocated'),
              latitude: Joi.number()
                .allow(null)
                .description('The latitude where the device is allocated'),
              totalResults: Joi.number().description(
                'The number of results performed by the device in the date range'
              ),
              maintenanceStatusHistory: Joi.array()
                .items(
                  Joi.object().keys({
                    day: Joi.date()
                      .required()
                      .description('The date of the reported status'),
                    isWeekend: Joi.bool().required(),
                    weekNumber: Joi.number().required(),
                    maintenanceStatusI18nKey: Joi.string().description(
                      'The i18nKey of the maintenance status'
                    ),
                    maintenanceStatusName: Joi.string().description(
                      'The name of the maintenance status'
                    ),
                    maintenanceStatusExternalId: Joi.string().description(
                      'The external id of the maintenance status'
                    ),
                    daysInSameStatus: Joi.number()
                      .description('The external id of the maintenance status')
                      .allow(null),
                    totalResults: Joi.number().description(
                      'Total results performed by the device in this day'
                    ),
                  })
                )
                .description(
                  'The maintenance status of the device in each day of the date range'
                ),
            })
          ),
        }),
      },
    },
  },
  {
    method: 'PUT',
    path: '/maintenance/update',
    handler: asyncHandler(deviceStatusOverTime),
    config: {
      description: 'Updates the maintenance status of a device in a date range',
      auth: { scope: ['device:edit'] },
      validate: {
        query: {
          deviceId: Joi.number().required(),
          dateFrom: Joi.date()
            .iso()
            .required()
            .description('From Date, inclusive'),
          dateTo: Joi.date()
            .iso()
            .required()
            .description('To Date, inclusive'),
          deviceMaintenanceStatusExternalId: Joi.string().required(),
          note: Joi.string()
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
        }),
      },
    },
  },
]

module.exports = { routes }
