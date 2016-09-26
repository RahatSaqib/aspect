let { lgaSelectList } = require('./lgaService')
let { asyncHandler } = require('../routes')
let Joi = require('joi')

module.exports = [{
  method: 'GET',
  path: '/lga/select-list/{stateId}',
  handler: asyncHandler(lgaSelectList),
  config: {
    description: 'List of LGAs for select list',
    notes: 'List of {id, name} objects',
    validate: {
      params: {
        stateId: Joi.string().description('State ID').required()
      }
    }
  }
}]
