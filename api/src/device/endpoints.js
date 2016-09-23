let Joi = require('joi')
let { asyncHandler, validateSortPageParams } = require('../routes')
let { listDevices, showDevice, updateDevice } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/device',
    handler: asyncHandler(listDevices),
    config: {
      description: 'Device List',
      notes: 'Pageable and sortable list of devices',
      auth: {scope: ['device:view', 'device:edit']},
      validate: {
        query: Object.assign({
          name: Joi.string().allow('').description('Filter for device name')
        }, validateSortPageParams('name', 'status', 'createdOn', 'lastSeen', 'totalTests'))
      }
    }
  },
  {
    method: 'GET',
    path: '/device/{deviceId}',
    handler: asyncHandler(showDevice),
    config: {
      description: 'Device Detail',
      notes: 'Detail of a device',
      auth: {scope: ['device:view', 'device:edit']},
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required()
        }
      }
    }
  },
  {
    method: 'PUT',
    path: '/device/{deviceId}',
    handler: asyncHandler(updateDevice),
    config: {
      description: 'Update Device Detail',
      notes: 'Detail of a device',
      auth: {scope: ['device:edit']},
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required()
        },
        payload: {
          name: Joi.string().required(),
          shortname: Joi.string().required(),
          notes: Joi.string().required(),
          siteId: Joi.number().required()
        }
      }
    }
  }
]
