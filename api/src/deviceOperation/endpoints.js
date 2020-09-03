const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listDeviceOperations } = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/device-operation',
    handler: asyncHandler(listDeviceOperations),
    config: {
      description: 'Device Operation List',
      notes: 'Pageable and sortable list of device operations',
      auth: { scope: ['device:view'] },
      validate: {
        query: {
          deviceId: Joi.string().description('Filter for device id'),
          ...validateSortPageParams('startedOn', 'id'),
        },
      },
    },
  },
]

module.exports = { routes }
