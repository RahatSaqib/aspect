const Joi = require('joi')
const {
  asyncHandler,
  validateDateRangeParams,
  validateSortPageParams
} = require('../routes')
const {
  listDevices,
  showDevice,
  updateDevice
} = require('./service')
const { validateAllGeographyFilterParams } = require('../geography/requestValidation')

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
          deviceName: Joi.string().allow('').description('Filter for device name'),
          category: Joi.string().description('Filter for device type category'),
          type: Joi.string().description('Filter for device type'),
          name: Joi.string().allow('').description('Filter for device name')
        }, validateAllGeographyFilterParams(),
          validateDateRangeParams(),
          validateSortPageParams('name', 'status', 'createdOn', 'lastSeen', 'totalTests'))
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
  }
]
