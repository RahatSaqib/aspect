let Joi = require('joi')
let { asyncHandler } = require('../routes')
let { listOrganisationalUnitsForSelectList } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/organisational-unit/select-list',
    handler: asyncHandler(listOrganisationalUnitsForSelectList),
    config: {
      description: 'Organisational Units for Select List',
      notes: 'List of organisational unit IDs and Names for selected partner',
      auth: {scope: ['person']},
      validate: {
        params: {
          partnerId: Joi.number().description('Partner ID').required()
        }
      }
    }
  }
]
