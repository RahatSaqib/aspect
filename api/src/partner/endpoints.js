let Joi = require('joi')
let { asyncHandler, validateSortPageParams } = require('../routes')
let { listPartners, showPartner, listPartnersForSelectList } = require('./service')

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
        }, validateSortPageParams('name', 'partnerTypeName'))
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
  },
  {
    method: 'GET',
    path: '/partner/select-list',
    handler: asyncHandler(listPartnersForSelectList),
    config: {
      description: 'Partners for Select List',
      notes: 'List of partner IDs and Names',
      auth: {scope: ['person']}
    }
  }
]
