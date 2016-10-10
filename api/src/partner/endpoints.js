let Joi = require('joi')
let { asyncHandler, validateSortPageParams } = require('../routes')
let { listPartners, showPartner } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/partner',
    handler: asyncHandler(listPartners),
    config: {
      description: 'Partner List',
      notes: 'Pageable and sortable list of partners',
      auth: {scope: ['device', 'site', 'partner']},
      validate: {
        query: Object.assign({
          name: Joi.string().allow('').description('Filter for partner name')
        }, validateSortPageParams('name', 'status', 'createdOn', 'lastSeen', 'totalTests'))
      }
    }
  },
  {
    method: 'GET',
    path: '/partner/{partnerId}',
    handler: asyncHandler(showPartner),
    config: {
      description: 'Partner Detail',
      notes: 'Detail of a partner',
      auth: {scope: ['device', 'site', 'partner']},
      validate: {
        params: {
          partnerId: Joi.string().description('Partner ID').required()
        }
      }
    }
  }
]
