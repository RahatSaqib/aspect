let Joi = require('joi')
let { asyncHandler, validateSortPageParams } = require('../routes')
let { listPeople, showPerson, updatePerson, updatePersonUserPreferences } = require('./service')

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
}, {
  method: 'GET',
  path: '/person/{personId}',
  handler: asyncHandler(showPerson),
  config: {
    description: 'Person Detail',
    notes: 'Details of a person',
    auth: {scope: ['person:view', 'person:edit', 'person:admin']},
    validate: {
      params: {
        personId: Joi.string().description('Person ID').required()
      }
    }
  }
}, {
  method: 'PUT',
  path: '/person/{personId}',
  handler: asyncHandler(updatePerson),
  config: {
    description: 'Update Person Details',
    notes: 'Details of a person',
    auth: {scope: ['person:edit', 'person:admin']},
    validate: {
      params: {
        personId: Joi.string().description('Person ID').required()
      },
      payload: {
        name: Joi.string().max(500).required(),
        title: Joi.string().max(255).allow('', null),
        email: Joi.string().max(500).allow('', null),
        email2: Joi.string().max(500).allow('', null),
        phone: Joi.string().max(45).allow('', null),
        cell: Joi.string().max(45).allow('', null),
        countryId: Joi.number().integer().positive().allow('', null),
        stateId: Joi.number().integer().positive().allow('', null),
        lgaId: Joi.number().integer().positive().allow('', null),
        zip: Joi.string().max(45).allow('', null),
        notes: Joi.string().optional().max(1200).allow('', null),
        lastPartnerId: Joi.number().integer().positive().allow('', null)
      }
    }
  }
}, {
  method: 'PUT',
  path: '/person/preferences/{personId}',
  handler: asyncHandler(updatePersonUserPreferences),
  config: {
    description: 'Update Person\'s User Preferences',
    notes: 'Timezone and Language',
    auth: {scope: ['person:edit', 'person:admin']},
    validate: {
      params: {
        personId: Joi.string().description('Person ID').required()
      },
      payload: {
        timezone: Joi.string().max(255).allow('', null),
        culture: Joi.string().max(45).allow('', null)
      }
    }
  }
}]

