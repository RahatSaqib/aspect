const Joi = require('joi')
const { validateAllGeographyFilterParams } = require('../geography/requestValidation')
const {
  asyncHandler,
  validateDateRangeParams,
  validateSortPageParams
} = require('../routes')
const {
  listSites,
  showSite,
  updateSite
} = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/site',
    handler: asyncHandler(listSites),
    config: {
      description: 'Site List',
      notes: 'Pageable and sortable list of sites',
      auth: { scope: ['site:view', 'site:edit'] },
      validate: {
        query: Object.assign({
          deviceName: Joi.string().allow('').description('Filter for device name'),
          siteName: Joi.string().allow('').description('Filter for site name')
        }, validateAllGeographyFilterParams(),
          validateDateRangeParams(),
          validateSortPageParams('name', 'shortname', 'state', 'lga', 'createdOn', 'totalDevices'))
      }
    }
  },
  {
    method: 'GET',
    path: '/site/{siteId}',
    handler: asyncHandler(showSite),
    config: {
      description: 'Site Detail',
      notes: 'Detail of a site',
      auth: { scope: ['site:view', 'site:edit'] },
      validate: {
        params: {
          siteId: Joi.string().description('Site id').required()
        }
      }
    }
  },
  {
    method: 'PUT',
    path: '/site/{siteId}',
    handler: asyncHandler(updateSite),
    config: {
      description: 'Update Site Detail',
      notes: 'Detail of a site',
      auth: { scope: ['site:edit'] },
      validate: {
        params: {
          siteId: Joi.number().integer().positive().description('Site id').required()
        },
        payload: {
          name: Joi.string().required(),
          shortname: Joi.string().required(),
          timezone: Joi.string().allow('', null),
          countryId: Joi.number().integer().positive().allow('', null),
          stateId: Joi.number().integer().positive().allow('', null),
          lgaId: Joi.number().integer().positive().allow('', null),
          street1: Joi.string().required(),
          street2: Joi.string().allow('', null),
          city: Joi.string().required(),
          zip: Joi.string().max(45).allow('', null),
          longitude: Joi.number().allow('', null),
          latitude: Joi.number().allow('', null)
        }
      }
    }
  }
]
