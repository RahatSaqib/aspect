let Joi = require('joi')
let { asyncHandler } = require('../routes')
let { listRolesForSelectList } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/role/select-list',
    handler: asyncHandler(listRolesForSelectList),
    config: {
      description: 'Roles for Select List',
      notes: 'List of role IDs and Names for roles not linked to any partner',
      auth: {scope: ['person']}
    }
  }, {
    method: 'GET',
    path: '/role/select-list/{partnerId}',
    handler: asyncHandler(listRolesForSelectList),
    config: {
      description: 'Roles for Select List',
      notes: 'List of role IDs and Names for selected partner',
      auth: {scope: ['person']},
      validate: {
        params: {
          partnerId: Joi.number().description('Partner ID').required()
        }
      }
    }
  }, {
    method: 'GET',
    path: '/role/select-list/{partnerId}/{organisationalUnitId}',
    handler: asyncHandler(listRolesForSelectList),
    config: {
      description: 'Roles for Select List',
      notes: 'List of role IDs and Names for selected organisational unit',
      auth: {scope: ['person']},
      validate: {
        params: {
          partnerId: Joi.number().description('Partner ID').required(),
          organisationalUnitId: Joi.number().description('Organisational Unit ID').required()
        }
      }
    }
  }
]
