let { stateSelectList } = require('./stateService')
let { asyncHandler } = require('../routes')
let Joi = require('joi')

module.exports = [{
  method: 'GET',
  path: '/state/select-list/{countryId}',
  handler: asyncHandler(stateSelectList),
  config: {
    description: 'List of states for select list',
    notes: 'List of {id, name} objects',
    validate: {
      params: {
        countryId: Joi.string().description('Country ID').required()
      }
    }
  }
}]
