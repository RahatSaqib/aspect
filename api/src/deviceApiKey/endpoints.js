const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listDeviceApiKeys } = require('./listDeviceApiKeys')
const { generateDeviceApiKeys } = require('./generateDeviceApiKeys')
const { revokeDeviceApiKey } = require('./revokeDeviceApiKey')
const { createDeviceApiKey } = require('./createDeviceApiKey')
const { validateAllGeographyFilterParams } = require('../geography/requestValidation')
const { exportDeviceApiKeys } = require('./exportDeviceApiKeys')

function listDeviceApiKeysBaseConfig() {
  return {
    auth: { scope: ['deviceApiKey:view', 'deviceApiKey:edit'] },
    validate: {
      query: {
        partnerId: Joi.number().allow('').description('Filter for partner ID'),
        deviceApiKeyToken: Joi.string().allow('').description('Filter for device API key token'),
        siteName: Joi.string().allow('').description('Filter for site name'),
        deviceName: Joi.string().allow('').description('Filter for device name'),
        revoked: Joi.number().integer().optional().description('Filter by revoked'),
        // query param 'format' is applicable only for handler 'exportDeviceApiKeys'
        format: Joi.string().allow('').description('File format for exporting data'),
        ...validateAllGeographyFilterParams(),
        ...validateSortPageParams('createdOn', 'token', 'partner', 'country', 'site', 'device', 'revoked'),
      },
    },
  }
}

const routes = [
  {
    method: 'GET',
    path: '/deviceApiKey',
    handler: listDeviceApiKeys,
    config: {
      description: 'DeviceApiKey List',
      notes: 'Pageable and sortable list of deviceApiKeys',
      ...listDeviceApiKeysBaseConfig(),
    },
  },
  {
    method: 'POST',
    path: '/deviceApiKey/api-key',
    handler: asyncHandler(createDeviceApiKey),
    config: {
      description: 'Create New API Key',
      notes: 'Create new API Key',
      auth: { scope: ['deviceApiKey:edit'] },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          token: Joi.string().required().description('The device token id'),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/deviceApiKey/export',
    handler: exportDeviceApiKeys,
    config: {
      description: 'Export DeviceApiKey List into Excel or CSV',
      notes: 'Filtered and sorted list of deviceApiKeys',
      ...listDeviceApiKeysBaseConfig(),
    },
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
          count: Joi.number().description('Number of deviceApiKeys should be generated').required(),
          siteId: Joi.number().allow('').description('Site ID'),
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
          deviceApiKeyId: Joi.number().description('DeviceApiKey id').required(),
        },
        payload: {
          revoked: Joi.bool().required(),
        },
      },
    },
  },
]

module.exports = { routes }
