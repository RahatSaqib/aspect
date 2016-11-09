const Joi = require('joi')
const { asyncHandler } = require('../routes')
const {
  getConsumableAssays,
  getAssayConsumables,
  createAssayConsumable,
  updateAssayConsumableQuantity,
  deleteAssayConsumable
} = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/consumable-assays/{consumableId}',
    handler: asyncHandler(getConsumableAssays),
    config: {
      description: 'Gets the consumable quantities for each assay for a specific consumable',
      notes: 'Returns a list of assay consumable records',
      auth: {scope: ['assay:view']},
      validate: {
        params: {
          consumableId: Joi.number().integer().positive().required()
        }
      }
    }
  }, {
    method: 'GET',
    path: '/assay-consumables/{assayId}',
    handler: asyncHandler(getAssayConsumables),
    config: {
      description: 'Gets the consumable quantities used by an assay run',
      notes: 'Returns a list of assay consumable records',
      auth: {scope: ['assay:view']},
      validate: {
        params: {
          assayId: Joi.number().integer().positive().required()
        }
      }
    }
  }, {
    method: 'POST',
    path: '/assay-consumable',
    handler: asyncHandler(createAssayConsumable),
    config: {
      description: 'Creates a new consumable quantity record for an assay',
      notes: 'Returns the created assay consumable record',
      auth: {scope: ['assay:view', 'assay:edit']},
      validate: {
        payload: {
          assayId: Joi.number().integer().positive().required(),
          consumableId: Joi.number().integer().positive().required(),
          quantity: Joi.number().positive().precision(2).required().description('Amount of consumable used per test (up to 2 decimal places)')
        }
      }
    }
  }, {
    method: 'PUT',
    path: '/assay-consumable/{assayId}/{consumableId}',
    handler: asyncHandler(updateAssayConsumableQuantity),
    config: {
      description: 'Updates the quantity of a consumable used by an assay run',
      notes: 'Returns the updated assay consumable record',
      auth: {scope: ['assay:view', 'assay:edit']},
      validate: {
        params: {
          assayId: Joi.number().integer().positive().required(),
          consumableId: Joi.number().integer().positive().required()
        },
        payload: {
          quantity: Joi.number().positive().precision(2).required().description('Amount of consumable used per test (up to 2 decimal places)')
        }
      }
    }
  }, {
    method: 'DELETE',
    path: '/assay-consumable/{assayId}/{consumableId}',
    handler: asyncHandler(deleteAssayConsumable),
    config: {
      description: 'Deletes a consumable quantity record for an assay',
      notes: 'Returns ok: true when successfully deleted',
      auth: {scope: ['assay:view', 'assay:edit']},
      validate: {
        params: {
          assayId: Joi.number().integer().positive().required(),
          consumableId: Joi.number().integer().positive().required()
        }
      }
    }
  }
]
