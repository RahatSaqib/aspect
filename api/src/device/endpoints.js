const Joi = require('joi')
const {
  asyncHandler,
  validateDateRangeParams,
  validateSortPageParams
} = require('../routes')
const {
  listDevices,
  showDevice,
  updateDevice,
  listStatusTypes,
  exportDevices,
  listDevicesForSelectList
} = require('./service')
const { validateAllGeographyFilterParams } = require('../geography/requestValidation')

function listDevicesBaseConfig() {
  return {
    auth: { scope: ['device:view', 'device:edit'] },
    validate: {
      query: Object.assign({
        hasResults: Joi.number().allow('').min(0).max(1).description('Filter for getting devices that can have results'),
        hasConnectivity: Joi.number().allow('').min(0).max(1).description('Filter for getting devices that can have connectivity'),
        assayId: Joi.number().allow('').description('Assay ID'),
        resultCategoryId: Joi.number().allow('').description('Result Category ID'),
        deviceName: Joi.string().allow('').description('Filter for device name'),
        deviceStatusId: Joi.number().allow('').description('Filter for device status ID'),
        category: Joi.string().description('Filter for device type category'),
        type: Joi.string().description('Filter for device type'),
        name: Joi.string().allow('').description('Filter for device name'),
        siteName: Joi.string().allow('').description('Filter for site name'),
        siteExternalId: Joi.string().allow('').description('Filter for facility code'),
        // query param 'format' is applicable only for handler 'exportDevices'
        format: Joi.string().allow('').description('File format for exporting data')
      },
      validateAllGeographyFilterParams(),
      validateDateRangeParams(),
      validateSortPageParams('name', 'state', 'status', 'createdOn', 'lastSeen', 'lastMonth', 'thisMonth', 'deliveredLastMonth', 'deliveredThisMonth', 'acknowledgedRatio', 'totalFlagged')
    ) }
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/device',
    handler: asyncHandler(listDevices),
    config: Object.assign({
      description: 'Device List',
      notes: 'Pageable and sortable list of devices'
    }, listDevicesBaseConfig())
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
          shortname: Joi.string().allow(''),
          notes: Joi.string().allow(''),
          statusToken: Joi.string().allow(''),
          configurationData: Joi.object().required().description(
            'Device configuration data.  The valid keys are dependent on Device Type.'
          )
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/device/status-types',
    handler: asyncHandler(listStatusTypes),
    config: {
      description: 'Device Status List',
      notes: 'Dictionary set of Device Status options',
      auth: { scope: ['device:view', 'device:edit'] }
    }
  },
  {
    method: 'GET',
    path: '/device/export',
    handler: asyncHandler(exportDevices),
    config: Object.assign({
      description: 'Export Device List into Excel or CSV',
      notes: 'Filtered and sorted list of devices'
    }, listDevicesBaseConfig())
  },
  {
    method: 'GET',
    path: '/device/select-list',
    handler: asyncHandler(listDevicesForSelectList),
    config: {
      description: 'Device for Select List',
      notes: 'List of device ID\'s and names',
      validate: {
        query: {
          countryId: Joi.number().allow('').description('Country ID'),
          partnerId: Joi.number().allow('').description('Partner ID'),
          siteId: Joi.number().allow('').description('Site ID')
        }
      }
    }
  }
]
