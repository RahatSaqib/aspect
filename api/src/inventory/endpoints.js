const Joi = require('joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listConsumableTypes, listConsumableReasons } = require('./inventoryService')
const { getConsumableAssays } = require('./consumableAssayService')

module.exports = [
  {
    method: 'GET',
    path: '/inventory/consumable-types',
    handler: asyncHandler(listConsumableTypes),
    config: {
      description: 'Consumable Types',
      notes: 'Pageable and sortable list of consumable types',
      auth: {scope: ['inventory:view', 'inventory:edit']},
      validate: {
        query: Object.assign({
          name: Joi.string().allow('').description('Filter for consumable type')
        }, validateSortPageParams('name'))
      }
    }
  }, {
    method: 'GET',
    path: '/inventory/consumable-reason',
    handler: asyncHandler(listConsumableReasons),
    config: {
      description: 'Consumable Reason',
      notes: 'Pageable and sortable list for reaons that a consumable was used',
      auth: {scope :['inventory:view', 'inventory:edit']},
      validate: {
        query: Object.assign({
          name: Joi.string().allow('').description('Filter for consumable reason')
        }, validateSortPageParams('name'))
      }
    }
  }, {
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
  }
]
