let Joi = require('joi')
let { asyncHandler, validateSortPageParams } = require('../routes')
let { listSites, showSite, updateSite } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/site',
    handler: asyncHandler(listSites),
    config: {
      description: 'Site List',
      notes: 'Pageable and sortable list of sites',
      auth: {scope: ['site:view', 'site:edit']},
      validate: {
        query: Object.assign({
          minDate: Joi.date().iso().allow(null).description('Start on'),
          maxDate: Joi.date().iso().allow(null).description('End on'),
          countryId: Joi.number().allow('').description('Country ID'),
          stateId: Joi.number().allow('').description('State ID'),
          lgaId: Joi.number().allow('').description('LGA ID'),
          deviceName: Joi.string().allow('').description('Filter for device name'),
          siteName: Joi.string().allow('').description('Filter for site name')
        }, validateSortPageParams('name', 'shortname', 'state', 'lga', 'createdOn', 'totalDevices'))
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
      auth: {scope: ['site:view', 'site:edit']},
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
      auth: {scope: ['site:edit']},
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
