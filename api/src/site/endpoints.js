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
          name: Joi.string().allow('').description('Filter for site name')
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
          siteId: Joi.string().description('Site id').required()
        },
        payload: {
          name: Joi.string().required(),
          shortname: Joi.string().required(),
          timezone: Joi.string().allow(''),
          countryId: Joi.string().required(),
          stateId: Joi.string().required(),
          lgaId: Joi.string().allow(''),
          street1: Joi.string().required(),
          street2: Joi.string().allow(''),
          city: Joi.string().required(),
          zip: Joi.string().required(),
          longitude: Joi.number().required(),
          latitude: Joi.number().required()
        }
      }
    }
  }
]
