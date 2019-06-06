const Joi = require('joi')
const { asyncHandler } = require('../routes')
const {
  buildGeographySelectList,
  countrySelectList,
  stateSelectList,
  lgaSelectList,
} = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/geography/select-list',
    handler: asyncHandler(buildGeographySelectList),
    config: {
      description: 'Country, State and LGA List',
      notes: 'List of countries with nested states and LGAs',
    },
  },
  {
    method: 'GET',
    path: '/geography/country-select-list',
    handler: asyncHandler(countrySelectList),
    config: {
      description: 'Country List',
      notes: 'List of country IDs and Names',
    },
  },
  {
    method: 'GET',
    path: '/geography/country-select-list/{countryId}',
    handler: asyncHandler(countrySelectList),
    config: {
      description: 'Country List With Selected Country',
      notes:
        'List of country IDs and Names With States Populated for Selected Country',
      validate: {
        params: {
          countryId: Joi.number()
            .description('Country ID')
            .required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/geography/country-select-list/{countryId}/{stateId}',
    handler: asyncHandler(countrySelectList),
    config: {
      description: 'Country List With Selected Country and State',
      notes:
        'List of country IDs and Names With States Populated for Selected Country and LGAs Populated for Selected State',
      validate: {
        params: {
          countryId: Joi.number()
            .description('Country ID')
            .required(),
          stateId: Joi.number()
            .description('State ID')
            .required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/geography/state-select-list/{countryId}',
    handler: asyncHandler(stateSelectList),
    config: {
      description: 'State List',
      notes: 'List of state IDs and Names',
      validate: {
        params: {
          countryId: Joi.number()
            .description('Country ID')
            .required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/geography/state-select-list/{countryId}/{stateId}',
    handler: asyncHandler(stateSelectList),
    config: {
      description: 'State List With LGAs for Selected State',
      notes:
        'List of state IDs and Names with LGAs populated for selected state',
      validate: {
        params: {
          countryId: Joi.number()
            .description('Country ID')
            .required(),
          stateId: Joi.number()
            .description('State ID')
            .required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/geography/lga-select-list/{stateId}',
    handler: asyncHandler(lgaSelectList),
    config: {
      description: 'LGA List',
      notes: 'List of LGA IDs and Names',
      validate: {
        params: {
          stateId: Joi.number()
            .description('State ID')
            .required(),
        },
      },
    },
  },
]

module.exports = { routes }
