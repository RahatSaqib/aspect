let Joi = require('joi')
let { asyncHandler, validateSortPageParams } = require('../util')
let { listSites } = require('./service')

module.exports = [{
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
      }, validateSortPageParams('name', 'shortname', 'state', 'lga', 'created_on', 'totalDevices'))
    }
  }
}]
