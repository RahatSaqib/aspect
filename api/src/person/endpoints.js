let Joi = require('joi')
let { asyncHandler, validateSortPageParams } = require('../routes')
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
        countryId: Joi.number().allow('').description('Country ID'),
        stateId: Joi.number().allow('').description('State ID'),
        lgaId: Joi.number().allow('').description('LGA ID'),
        contactNameOrEmail: Joi.string().allow('').description('Filter for person name/email')
      }, validateSortPageParams('name', 'level', 'state', 'lga'))
    }
  }
}]
