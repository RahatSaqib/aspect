let Joi = require('joi')
let { asyncHandler, validateSortPageParams } = require('../util')
let { listPeople } = require('./service')

module.exports = [{
  method: 'GET',
  path: '/person',
  handler: asyncHandler(listPeople),
  config: {
    description: 'People List',
    notes: 'Pageable and sortable list of people',
    auth: {scope: ['person:view', 'person:edit']},
    validate: {
      query: Object.assign({
        name: Joi.string().allow('').description('Filter for person name')
      }, validateSortPageParams('name', 'level', 'state', 'lga'))
    }
  }
}]
