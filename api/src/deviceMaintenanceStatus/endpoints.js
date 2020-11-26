const Joi = require('@hapi/joi')

const { asyncHandler } = require('../routes')
const { deviceStatusOverTime } = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/device-maintenance-status/over-time',
    handler: asyncHandler(deviceStatusOverTime),
    config: {
      description: 'Device Status Over Time',
      notes: "List of devices and their status history over time",
      auth: { scope: ['device:view'] },
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
      }
    },
  },
]

module.exports = { routes }
