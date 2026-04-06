const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const {
  buildGeographySelectList,
  countrySelectList,
  stateSelectList,
  stateSelectListForUser,
  lgaSelectList,
} = require('./service')
const getLevelByUserSelectList = require('./getLevelByUserSelectList')
const { updateState } = require('./state/updateState')
const { updateLga } = require('./state/updateLga')
const { createLga } = require('./state/createLga')
const { createState } = require('./state/createState')
const { deleteState } = require('./state/deleteState')
const { deleteLga } = require('./state/deleteLga')
const { listStates } = require('./state/listStates')
const { listLgas } = require('./state/listLgas')

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
      validate: {
        query: {
          all: Joi.boolean().description('Should return all of countries').allow(null),
        },
      },
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
      notes: 'List of country IDs and Names With States Populated for Selected Country',
      validate: {
        params: {
          countryId: Joi.number().description('Country ID').required(),
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
          countryId: Joi.number().description('Country ID').required(),
          stateId: Joi.number().description('State ID').required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/geography/state-select-list-by-stateId/{stateId?}',
    handler: asyncHandler(stateSelectList),
    config: {
      description: 'State List',
      notes: 'List of state IDs and Names',
      auth: { scope: ['site'] },
      validate: {
        params: {
          stateId: Joi.number().description('State ID').optional(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/geography/state-select-list/{countryId}',
    handler: asyncHandler(stateSelectListForUser),
    config: {
      description: 'State List',
      notes: 'List of state IDs and Names',
      validate: {
        query: {
          all: Joi.boolean().description('Should return all of states').allow(null),
          onlyAssociatedSites: Joi.boolean().description('Should return states has only associated sites').allow(null),
        },
        params: {
          countryId: Joi.number().description('Country ID').required(),
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
      notes: 'List of state IDs and Names with LGAs populated for selected state',
      validate: {
        params: {
          countryId: Joi.number().description('Country ID').required(),
          stateId: Joi.number().description('State ID').required(),
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
        query: {
          all: Joi.boolean().description('Should return all of LGAs').allow(null),
        },
        params: {
          stateId: Joi.number().description('State ID').required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/geography/level-by-user-select-list',
    handler: getLevelByUserSelectList,
    config: {
      auth: { scope: ['notification'] },
      description: 'Get levels by user',
      notes: 'levels and Names',
    },
  },
  {
    method: 'GET',
    path: '/geography/states',
    handler: asyncHandler(listStates),
    config: {
      description: 'List States',
      validate: {
        query: {
          ...validateSortPageParams('name', 'abbreviation'),
          stateId: Joi.string().description('The id of the state'),
        },
      },
      response: {
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          total: Joi.number().required().description('The total number of states that match the given filters'),
          length: Joi.number().required().description('The number of states included in this response'),
          data: Joi.array()
            .required()
            .description('The states')
            .items(
              Joi.object().keys({
                id: Joi.number().description('The id of the state'),
                name: Joi.string().description('The name of the state'),
                abbreviation: Joi.string().allow('', null).description('The abbreviation of the state'),
                siteCount: Joi.number(),
                issueCount: Joi.number(),
                deviceApiKeyCount: Joi.number(),
                personCount: Joi.number(),
                jobContextCount: Joi.number(),
                lgaCount: Joi.number(),
                notificationCount: Joi.number(),
                cannotDelete: Joi.boolean(),
              })
            ),
        }),
      },
      auth: { scope: ['admin:edit'] },
    },
  },
  {
    method: 'PUT',
    path: '/geography/states/{stateId}',
    handler: asyncHandler(updateState),
    config: {
      description: 'Update State',
      validate: {
        params: {
          stateId: Joi.number().description('State Id').required(),
        },
        payload: {
          name: Joi.string().required(),
          abbreviation: Joi.string().required(),
        },
      },
      auth: { scope: ['admin:edit'] },
    },
  },
  {
    method: 'POST',
    path: '/geography/states',
    handler: asyncHandler(createState),
    config: {
      description: 'Create State',
      validate: {
        payload: {
          name: Joi.string().required(),
          abbreviation: Joi.string().required(),
        },
      },
      auth: { scope: ['admin:edit'] },
    },
  },
  {
    method: 'DELETE',
    path: '/geography/states/{stateId}',
    handler: asyncHandler(deleteState),
    config: {
      description: 'Delete State',
      validate: {
        params: {
          stateId: Joi.number().description('State Id').required(),
        },
      },
      auth: { scope: ['admin:edit'] },
    },
  },
  {
    method: 'GET',
    path: '/geography/lgas',
    handler: asyncHandler(listLgas),
    config: {
      description: 'List Lgas',
      validate: {
        query: {
          ...validateSortPageParams('name'),
          name: Joi.string().description('The name of the lga'),
          stateId: Joi.number().description('The id of the state associated to the lga'),
        },
      },
      response: {
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          total: Joi.number().required().description('The total number of lgas that match the given filters'),
          length: Joi.number().required().description('The number of lgas included in this response'),
          data: Joi.array()
            .required()
            .description('The lgas')
            .items(
              Joi.object().keys({
                id: Joi.number().description('The id of the lga'),
                name: Joi.string().description('The name of the lga'),
                stateId: Joi.number().description('The id of the state associated to the lga'),
                stateName: Joi.string().description('The name of the state associated to the lga'),
                siteCount: Joi.number(),
                issueCount: Joi.number(),
                deviceApiKeyCount: Joi.number(),
                personCount: Joi.number(),
                jobContextCount: Joi.number(),
                notificationCount: Joi.number(),
                cannotDelete: Joi.boolean(),
              })
            ),
        }),
      },
      auth: { scope: ['admin:edit'] },
    },
  },
  {
    method: 'PUT',
    path: '/geography/lgas/{lgaId}',
    handler: asyncHandler(updateLga),
    config: {
      description: 'Update Lga',
      validate: {
        params: {
          lgaId: Joi.number().description('Lga Id').required(),
        },
        payload: {
          name: Joi.string().required(),
          stateId: Joi.number().description('State Id').required(),
        },
      },
      auth: { scope: ['admin:edit'] },
    },
  },
  {
    method: 'POST',
    path: '/geography/lgas',
    handler: asyncHandler(createLga),
    config: {
      description: 'Create Lga',
      validate: {
        payload: {
          name: Joi.string().required(),
          stateId: Joi.number().description('State Id').required(),
        },
      },
      auth: { scope: ['admin:edit'] },
    },
  },
  {
    method: 'DELETE',
    path: '/geography/lgas/{lgaId}',
    handler: asyncHandler(deleteLga),
    config: {
      description: 'Delete Lga',
      validate: {
        params: {
          lgaId: Joi.number().description('Lga Id').required(),
        },
      },
      auth: { scope: ['admin:edit'] },
    },
  },
]

module.exports = { routes }
