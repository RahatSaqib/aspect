let Joi = require('joi')
let { asyncHandler, validateSortPageParams } = require('../routes')
let { listSites, showSite } = require('./service')

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
  }
]
