const Joi = require('joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listDevices, showDevice, updateDevice, getDeviceApiKey,
  listDeviceOperation, listDeviceConfiguration } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/device',
    handler: asyncHandler(listDevices),
    config: {
      description: 'Device List',
      notes: 'Pageable and sortable list of devices',
      auth: { scope: ['device:view', 'device:edit'] },
      validate: {
        query: Object.assign({
          hasResults: Joi.number().allow('').min(0).max(1).description('Filter for getting devices that can have results'),
          hasConnectivity: Joi.number().allow('').min(0).max(1).description('Filter for getting devices that can have connectivity'),
          assayId: Joi.number().allow('').description('Assay ID'),
          resultCategoryId: Joi.number().allow('').description('Result Category ID'),
          minDate: Joi.date().iso().allow(null).description('Start on'),
          maxDate: Joi.date().iso().allow(null).description('End on'),
          countryId: Joi.number().allow('').description('Country ID'),
          stateId: Joi.number().allow('').description('State ID'),
          lgaId: Joi.number().allow('').description('LGA ID'),
          deviceName: Joi.string().allow('').description('Filter for device name'),
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
      auth: { scope: ['device:view', 'device:edit'] },
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
      auth: { scope: ['device:edit'] },
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
    path: '/device/{deviceId}/api-key',
    handler: asyncHandler(getDeviceApiKey),
    config: {
      description: 'Get Device API Key',
      notes: 'Get API Key for the specified device',
      // auth: {scope: []},  admin only
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required()
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
      auth: { scope: ['device:view', 'device:edit'] },
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
      auth: { scope: ['device:view', 'device:edit'] },
      validate: {
        query: Object.assign({
          deviceId: Joi.string().description('Device id').description('Filter for device id'),
          deviceName: Joi.string().allow('').description('Filter for device name')
        }, validateSortPageParams('deviceName', 'createdOn', 'updatedOn'))
      }
    }
  }
]
