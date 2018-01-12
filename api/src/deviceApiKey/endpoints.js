const Joi = require('joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const {
  listDeviceApiKeys,
  exportDeviceApiKeys,
  generateDeviceApiKeys,
  assignDeviceApiKeys,
  revokeDeviceApiKey,
} = require('./service')
const {
  validateAllGeographyFilterParams,
} = require('../geography/requestValidation')

function listDeviceApiKeysBaseConfig() {
  return {
    auth: { scope: ['deviceApiKey:view', 'deviceApiKey:edit'] },
    validate: {
      query: Object.assign(
        {
          partnerId: Joi.number()
            .allow('')
            .description('Filter for partner ID'),
          siteName: Joi.string()
            .allow('')
            .description('Filter for site name'),
          deviceName: Joi.string()
            .allow('')
            .description('Filter for device name'),
          // query param 'format' is applicable only for handler 'exportDeviceApiKeys'
          format: Joi.string()
            .allow('')
            .description('File format for exporting data'),
        },
        validateAllGeographyFilterParams(),
        validateSortPageParams(
          'createdOn',
          'token',
          'partner',
          'country',
          'site',
          'device',
          'revoked'
        )
      ),
    },
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/deviceApiKey',
    handler: asyncHandler(listDeviceApiKeys),
    config: Object.assign(
      {
        description: 'DeviceApiKey List',
        notes: 'Pageable and sortable list of deviceApiKeys',
      },
      listDeviceApiKeysBaseConfig()
    ),
  },
  {
    method: 'GET',
    path: '/deviceApiKey/export',
    handler: asyncHandler(exportDeviceApiKeys),
    config: Object.assign(
      {
        description: 'Export DeviceApiKey List into Excel or CSV',
        notes: 'Filtered and sorted list of deviceApiKeys',
      },
      listDeviceApiKeysBaseConfig()
    ),
  },
  {
    method: 'POST',
    path: '/deviceApiKey/generate',
    handler: asyncHandler(generateDeviceApiKeys),
    config: {
      description: 'Generate DeviceApiKey List',
      notes: 'Bulk generate for DeviceApiKey List',
      auth: { scope: ['deviceApiKey:edit'] },
      validate: {
        payload: {
          count: Joi.number()
            .description('Number of deviceApiKeys should be generated')
            .required(),
          countryId: Joi.number()
            .allow('')
            .description('Country ID'),
          partnerId: Joi.number()
            .allow('')
            .description('Partner ID'),
          siteId: Joi.number()
            .allow('')
            .description('Site ID'),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/deviceApiKey/assign',
    handler: asyncHandler(assignDeviceApiKeys),
    config: {
      description: 'Assign DeviceApiKey List',
      notes: 'Bulk assign for DeviceApiKey List to the given Device',
      auth: { scope: ['deviceApiKey:edit'] },
      validate: {
        payload: {
          deviceApiKeyIds: Joi.array()
            .items(Joi.number())
            .description('DeviceApiKey IDs'),
          deviceId: Joi.number()
            .allow('')
            .description('Device ID'),
          countryId: Joi.number()
            .allow('')
            .description('Country ID'),
          partnerId: Joi.number()
            .allow('')
            .description('Partner ID'),
          siteId: Joi.number()
            .allow('')
            .description('Site ID'),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/deviceApiKey/{deviceApiKeyId}',
    handler: asyncHandler(revokeDeviceApiKey),
    config: {
      description: 'Update DeviceApiKey',
      notes: 'Update a deviceApiKey',
      auth: { scope: ['deviceApiKey:edit'] },
      validate: {
        params: {
          deviceApiKeyId: Joi.number()
            .description('DeviceApiKey id')
            .required(),
        },
        payload: {
          revoked: Joi.bool().required(),
        },
      },
    },
  },
]
