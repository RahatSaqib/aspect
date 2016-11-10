let Joi = require('joi')
let { asyncHandler, validateSortPageParams } = require('../routes')
let {
  listConsumableTypes,
  listConsumableReasons,
  listInventoryItems,
  listInventoryItemsGroupedBySite,
  listInventoryItemsGroupedByConsumable,
  listInventoryItemsGroupedBySiteConsumable
} = require('./service')

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
    path: '/inventory',
    handler: asyncHandler(listInventoryItems),
    config: {
      description: 'Inventory List',
      notes: 'Pageable and sortable list of inventory items',
      auth: {scope :['inventory:view', 'inventory:edit']},
      validate: {
        query: Object.assign({
          consumableId: Joi.number().integer().positive().allow('', null),
          siteName: Joi.string().allow('', null)
        }, validateSortPageParams())
      }
    }
  }, {
    method: 'GET',
    path: '/inventory/group-by-site',
    handler: asyncHandler(listInventoryItemsGroupedBySite),
    config: {
      description: 'Inventory List Grouped by Site',
      notes: 'Pageable and sortable list of inventory items grouped by site',
      auth: {scope :['inventory:view', 'inventory:edit']},
      validate: {
        query: Object.assign({
          consumableId: Joi.number().integer().positive().allow('', null),
          siteName: Joi.string().allow('', null)
        }, validateSortPageParams())
      }
    }
  }, {
    method: 'GET',
    path: '/inventory/group-by-consumable',
    handler: asyncHandler(listInventoryItemsGroupedByConsumable),
    config: {
      description: 'Inventory List Grouped by Consumable',
      notes: 'Pageable and sortable list of inventory items grouped by consumable',
      auth: {scope :['inventory:view', 'inventory:edit']},
      validate: {
        query: Object.assign({
          consumableId: Joi.number().integer().positive().allow('', null),
          siteName: Joi.string().allow('', null)
        }, validateSortPageParams())
      }
    }
  }, {
    method: 'GET',
    path: '/inventory/group-by-site-and-consumable',
    handler: asyncHandler(listInventoryItemsGroupedBySiteConsumable),
    config: {
      description: 'Inventory List Grouped by Site and then by Consumable',
      notes: 'Pageable and sortable list of inventory items grouped by site then consumable',
      auth: {scope :['inventory:view', 'inventory:edit']},
      validate: {
        query: Object.assign({
          consumableId: Joi.number().integer().positive().allow('', null),
          siteName: Joi.string().allow('', null)
        }, validateSortPageParams())
      }
    }
  }
]
