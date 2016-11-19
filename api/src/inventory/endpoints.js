const Joi = require('joi')
const { validateAllGeographyFilterParams } = require('../geography/requestValidation')
const {
  asyncHandler,
  validateDateRangeParams,
  validateSortPageParams
} = require('../routes')
const {
  listInventoryItems,
  listInventoryItemsGroupedBySite,
  listInventoryItemsGroupedBySiteAndConsumable
} = require('./service')

const inventoryFilters = {
  consumableId: Joi.number().integer().positive().allow('', null),
  siteName: Joi.string().allow('', null)
}

module.exports = [
  {
    method: 'GET',
    path: '/inventory',
    handler: asyncHandler(listInventoryItems),
    config: {
      description: 'Inventory List',
      notes: 'Pageable and sortable list of inventory items',
      auth: { scope: ['inventory:view', 'inventory:edit'] },
      validate: {
        query: Object.assign(inventoryFilters,
          validateAllGeographyFilterParams(),
          validateDateRangeParams(),
          validateSortPageParams())
      }
    }
  }, {
    method: 'GET',
    path: '/inventory/group-by-site',
    handler: asyncHandler(listInventoryItemsGroupedBySite),
    config: {
      description: 'Inventory List Grouped by Site',
      notes: 'Pageable and sortable list of inventory items grouped by site',
      auth: { scope: ['inventory:view', 'inventory:edit'] },
      validate: {
        query: Object.assign(inventoryFilters,
          validateAllGeographyFilterParams(),
          validateDateRangeParams(),
          validateSortPageParams())
      }
    }
  }, {
    method: 'GET',
    path: '/inventory/group-by-site-and-consumable',
    handler: asyncHandler(listInventoryItemsGroupedBySiteAndConsumable),
    config: {
      description: 'Inventory List Grouped by Site and then by Consumable',
      notes: 'Pageable and sortable list of inventory items grouped by site then consumable',
      auth: { scope: ['inventory:view', 'inventory:edit'] },
      validate: {
        query: Object.assign(inventoryFilters,
          validateAllGeographyFilterParams(),
          validateDateRangeParams(),
          validateSortPageParams())
      }
    }
  }
]
