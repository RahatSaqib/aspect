let Joi = require('joi')
let { asyncHandler } = require('../routes')
let { buildGeographySelectList, countrySelectList, stateSelectList, lgaSelectList } = require('./service')

module.exports = [{
  method: 'GET',
  path: '/geography/select-list',
  handler: asyncHandler(buildGeographySelectList),
  config: {
    description: 'Country, State and LGA List',
    notes: 'List of countries with nested states and LGAs'
  }
}, {
  method: 'GET',
  path: '/geography/country-select-list',
  handler: asyncHandler(countrySelectList),
  config: {
    description: 'Country List',
    notes: 'List of country IDs and Names'
  }
}, {
  method: 'GET',
  path: '/geography/state-select-list/{countryId}',
  handler: asyncHandler(stateSelectList),
  config: {
    description: 'State List',
    notes: 'List of state IDs and Names',
    validate: {
      params: {
        countryId: Joi.number().description('Country ID').required()
      }
    }
  }
}, {
  method: 'GET',
  path: '/geography/lga-select-list/{stateId}',
  handler: asyncHandler(lgaSelectList),
  config: {
    description: 'LGA List',
    notes: 'List of LGA IDs and Names',
    validate: {
      params: {
        stateId: Joi.number().description('State ID').required()
      }
    }
  }
}]
