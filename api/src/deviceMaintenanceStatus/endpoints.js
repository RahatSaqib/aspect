const Joi = require('@hapi/joi')

const { asyncHandler } = require('../routes')
const { deviceStatusOverTime, deviceStatusLastReported } = require('./service')
const { joiSingleDeviceStatusOverTime } = require('../shared/validation')

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
          data: Joi.array().items(joiSingleDeviceStatusOverTime),
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
