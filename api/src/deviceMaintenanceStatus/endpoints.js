const Joi = require('@hapi/joi')

const { asyncHandler } = require('../routes')
const { deviceStatusOverTime, deviceStatusLastReported } = require('./service')

const { REGEX_ISODATESTRING } = require('../shared/date')

const routes = [
  {
    method: 'GET',
    path: '/device/maintenance-over-time',
    handler: asyncHandler(deviceStatusOverTime),
    config: {
      description: 'Device Status Over Time',
      notes: 'List of devices and their status history over time',
      auth: { scope: ['device', 'operationalData'] },
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
          data: Joi.array().items(
            Joi.object().keys({
              id: Joi.number().required().description('The id of the device'),
              name: Joi.string().required().description('The name of the device'),
              shortName: Joi.string().description('The short name of the device'),
              longitude: Joi.number().allow(null).description('The longitude where the device is allocated'),
              latitude: Joi.number().allow(null).description('The latitude where the device is allocated'),
              totalResults: Joi.number().description('The number of results performed by the device in the date range'),
              deviceCapacity: Joi.number().allow(null).description('Daily capacity of the device'),
              siteId: Joi.number().description('The siteId of the device'),
              hoursStart: Joi.number().allow(null).description('The site starting hour'),
              hoursEnd: Joi.number().allow(null).description('The site end hour'),
              maintenanceStatusHistory: Joi.array()
                .items(
                  Joi.object().keys({
                    day: Joi.date().required().description('The date of the reported status'),
                    isWeekend: Joi.bool().required(),
                    weekNumber: Joi.number().required(),
                    maintenanceStatusI18nKey: Joi.string().description('The i18nKey of the maintenance status'),
                    maintenanceStatusName: Joi.string().description('The name of the maintenance status'),
                    maintenanceStatusExternalId: Joi.string().description('The external id of the maintenance status'),
                    daysInSameStatus: Joi.number().description('The external id of the maintenance status').allow(null),
                    totalResults: Joi.number().description('Total results performed by the device in this day'),
                    maintenanceStatusManuallySetBy: Joi.object()
                      .allow(null)
                      .description('Member responsible for manually setting the status'),
                    maintenanceStatusNotes: Joi.string()
                      .description('The note for current maintenance status')
                      .allow('', null),
                  })
                )
                .description('The maintenance status of the device in each day of the date range'),
              siteContacts: Joi.array()
                .items(
                  Joi.object().keys({
                    personId: Joi.number().required().description('Person Id'),
                    name: Joi.string().required().description('Person name'),
                    email: Joi.string().optional().allow('', null).description('Person email'),
                    phone: Joi.array().optional().items(Joi.string()),
                    disabled: Joi.bool().optional().allow(null).description('Flag if Person is disabled'),
                    disabledOn: Joi.date()
                      .optional()
                      .allow(null)
                      .description('The date when Person was disabled, if any'),
                  })
                )
                .optional()
                .description(`Device's Site contacts`),
            })
          ),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/device/maintenance-last-reported',
    handler: asyncHandler(deviceStatusLastReported),
    config: {
      description: 'Last Reported Device Status By Device',
      notes: 'List of devices and their latest status',
      auth: { scope: ['device', 'operationalData'] },
      validate: {
        query: {
          excludeNotLocalizableDevices: Joi.bool()
            .description('If True, devices without latitude or longitude will be excluded')
            .default(false),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.array().items(
            Joi.object().keys({
              id: Joi.number().required().description('The id of the device'),
              name: Joi.string().required().description('The name of the device'),
              shortName: Joi.string().description('The short name of the device'),
              longitude: Joi.number().allow(null).description('The longitude where the device is allocated'),
              latitude: Joi.number().allow(null).description('The latitude where the device is allocated'),
              maintenanceStatusName: Joi.string().description('The name of the maintenance status'),
              maintenanceStatusI18nKey: Joi.string().description('The format key of the maintenance status name'),
              maintenanceStatusExternalId: Joi.string().description('The external id of the maintenance status'),
              maintenanceStatusNotes: Joi.string()
                .description('The note for current maintenance status')
                .allow('', null),
            })
          ),
        }),
      },
    },
  },
]

module.exports = { routes }
