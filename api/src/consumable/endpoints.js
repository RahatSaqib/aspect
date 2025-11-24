const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const {
  listConsumableTypes,
  listConsumableReasons,
  getConsumableById,
  getUnits,
  updateConsumable,
} = require('./consumableService')
const {
  getConsumableAssays,
  getAssayConsumables,
  createAssayConsumable,
  updateAssayConsumableQuantity,
  deleteAssayConsumable,
} = require('./assayConsumableService')

const routes = [
  {
    method: 'GET',
    path: '/inventory/consumable-types',
    handler: asyncHandler(listConsumableTypes),
    config: {
      description: 'Consumable Types',
      notes: 'Pageable and sortable list of consumable types',
      auth: { scope: ['browse'] },
      validate: {
        query: {
          name: Joi.string().allow('').description('Filter for consumable type'),
          ...validateSortPageParams('name', 'quantityOnHand', 'unit'),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/inventory/unit',
    handler: asyncHandler(getUnits),
    config: {
      description: 'Unit',
      notes: 'list of unit',
      auth: { scope: ['browse'] },
    },
  },
  {
    method: 'GET',
    path: '/inventory/{consumableId}',
    handler: asyncHandler(getConsumableById),
    config: {
      description: 'Gets the consumable By Id',
      notes: 'Returns consumable details',
      auth: { scope: ['browse'] },
      validate: {
        params: Joi.object({
          consumableId: Joi.number().integer().positive().required(),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/inventory/consumable-reason',
    handler: asyncHandler(listConsumableReasons),
    config: {
      description: 'Consumable Reason',
      notes: 'Pageable and sortable list for reaons that a consumable was used',
      auth: { scope: ['browse'] },
      validate: {
        query: {
          name: Joi.string().allow('').description('Filter for consumable reason'),
          ...validateSortPageParams('name'),
        },
      },
      response: {
        schema: {
          ok: Joi.bool().required(),
          total: Joi.number().integer().required(),
          length: Joi.number().integer().required(),
          data: Joi.array().items(
            Joi.object().keys({
              id: Joi.number().integer().required(),
              name: Joi.string().max(255).allow('', null),
              i18nKey: Joi.string().max(255).allow('', null),
              effectOnStock: Joi.string().valid('increase', 'decrease', 'resetToValue').required(),
              userSelectable: Joi.number().integer(),
              externalId: Joi.string(),
            })
          ),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/consumable-assays/{consumableId}',
    handler: asyncHandler(getConsumableAssays),
    config: {
      description: 'Gets the consumable quantities for each assay for a specific consumable',
      notes: 'Returns a list of assay consumable records',
      auth: { scope: ['assay'] },
      validate: {
        params: {
          consumableId: Joi.number().integer().positive().required(),
        },
      },
      response: {
        schema: {
          ok: Joi.bool().required(),
          data: Joi.array().items(
            Joi.object().keys({
              consumableId: Joi.number().integer().required(),
              assayId: Joi.number().integer().required(),
              quantity: Joi.number(),
              consumableName: Joi.string().max(255).allow('', null),
              consumableExternalId: Joi.string().max(255).allow('', null),
              unitName: Joi.string().max(255).allow('', null),
              unitShortName: Joi.string().max(50).allow('', null),
              assayName: Joi.string().max(255).allow('', null),
              assayI18nKey: Joi.string().max(255).allow('', null),
              strategy: Joi.string().optional().allow(null, ''),
            })
          ),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/assay-consumables/{assayId}',
    handler: asyncHandler(getAssayConsumables),
    config: {
      description: 'Gets the consumable quantities used by an assay run',
      notes: 'Returns a list of assay consumable records',
      auth: { scope: ['assay'] },
      validate: {
        params: {
          assayId: Joi.number().integer().positive().required(),
        },
      },
      response: {
        schema: {
          ok: Joi.bool().required(),
          data: Joi.array().items(
            Joi.object().keys({
              consumableId: Joi.number().integer().required(),
              assayId: Joi.number().integer().required(),
              quantity: Joi.number(),
              consumableName: Joi.string().max(255).allow('', null),
              consumableExternalId: Joi.string().max(255).allow('', null),
              unitName: Joi.string().max(255).allow('', null),
              unitShortName: Joi.string().max(50).allow('', null),
              assayName: Joi.string().max(255).allow('', null),
              assayI18nKey: Joi.string().max(255).allow('', null),
              strategy: Joi.string().optional().allow(null, ''),
            })
          ),
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/assay-consumable',
    handler: asyncHandler(createAssayConsumable),
    config: {
      description: 'Creates a new consumable quantity record for an assay',
      notes: 'Returns the created assay consumable record',
      auth: { scope: ['assay'] },
      validate: {
        payload: {
          assayId: Joi.number().integer().positive().required(),
          consumableId: Joi.number().integer().positive().required(),
          quantity: Joi.number()
            .positive()
            .precision(2)
            .required()
            .description('Amount of consumable used per test (up to 2 decimal places)'),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/inventory/consumable/{consumableId}',
    handler: asyncHandler(updateConsumable),
    config: {
      description: 'Update Consumable',
      auth: { scope: ['assay'] },
      notes: 'Update a consumable',
      validate: {
        params: {
          consumableId: Joi.number().integer().positive().description('Consumable id').required(),
        },
        payload: {
          name: Joi.string().required(),
          manufacturer: Joi.string().required(),
          partNumber: Joi.string().allow('', null),
          adjustment: Joi.string().allow('', null),
          strategy: Joi.string().allow('', null),
          price: Joi.number().allow('', null),
          unit: Joi.number().allow('', null),
          canExpire: Joi.boolean().allow(null),
          includeLocation: Joi.boolean().allow(null),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/assay-consumable/{assayId}/{consumableId}',
    handler: asyncHandler(updateAssayConsumableQuantity),
    config: {
      description: 'Updates the quantity of a consumable used by an assay run',
      notes: 'Returns the updated assay consumable record',
      auth: { scope: ['assay'] },
      validate: {
        params: {
          assayId: Joi.number().integer().positive().required(),
          consumableId: Joi.number().integer().positive().required(),
        },
        payload: {
          quantity: Joi.number()
            .positive()
            .precision(2)
            .required()
            .description('Amount of consumable used per test (up to 2 decimal places)'),
        },
      },
    },
  },
  {
    method: 'DELETE',
    path: '/assay-consumable/{assayId}/{consumableId}',
    handler: asyncHandler(deleteAssayConsumable),
    config: {
      description: 'Deletes a consumable quantity record for an assay',
      notes: 'Returns ok: true when successfully deleted',
      auth: { scope: ['assay'] },
      validate: {
        params: {
          assayId: Joi.number().integer().positive().required(),
          consumableId: Joi.number().integer().positive().required(),
        },
      },
    },
  },
]

module.exports = { routes }
