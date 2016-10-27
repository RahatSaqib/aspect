let Joi = require('joi')
let { asyncHandler, validateSortPageParams } = require('../routes')
let { listDevices, showDevice, updateDevice,
  listDeviceOperation, listDeviceConfiguration} = require('./service')

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
          hasResults: Joi.number().min(0).max(1).description('Filter for getting devices that can have results'),
          hasConnectivity: Joi.number().min(0).max(1).description('Filter for getting devices that can have connectivity'),
          category: Joi.string().description('Filter for device type category'),
          type: Joi.string().description('Filter for device type'),
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
          siteId: Joi.number().required(),
          name: Joi.string().required(),
          shortname: Joi.string().required(),
          notes: Joi.string().allow('')
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/device/configuration',
    handler: asyncHandler(listDeviceConfiguration),
    config: {
      notes: 'List Device Configuration',
      description: 'List device configuration data for the specified device',
      auth: {scope: ['device:view', 'device:edit']},
      validate: {
        query: Object.assign({
          deviceId: Joi.string().description('Device id').description('Filter for device id'),
          deviceName: Joi.string().allow('').description('Filter for device name')
        }, validateSortPageParams('deviceName', 'createdOn', 'updatedOn'))
      }
    }
  },
  {
    method: 'GET',
    path: '/device/operation',
    handler: asyncHandler(listDeviceOperation),
    config: {
      notes: 'List Device Operation',
      description: 'List device operational data for the specified device',
      auth: {scope: ['device:view', 'device:edit']},
      validate: {
        query: Object.assign({
          deviceId: Joi.string().description('Device id').description('Filter for device id'),
          deviceName: Joi.string().allow('').description('Filter for device name')
        }, validateSortPageParams('deviceName', 'createdOn', 'updatedOn'))
      }
    }
  }
]
