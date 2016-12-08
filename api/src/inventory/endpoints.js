const Joi = require('joi')
const { validateAllGeographyFilterParams } = require('../geography/requestValidation')
const {
  asyncHandler,
  validateDateRangeParams,
  validateSortPageParams
} = require('../routes')
const {
  listInventoryItems,
  listInventoryItemsGroupedBySite
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
      description: 'List of Consumables on Hand At Site',
      notes: 'Pageable and sortable list of inventory items',
      auth: { scope: ['inventory:view', 'inventory:edit'] },
      validate: {
        query: Object.assign(inventoryFilters,
          validateAllGeographyFilterParams(),
          validateDateRangeParams(),
          validateSortPageParams('consumableName', 'manufacturer', 'siteName', 'countryName', 'stateName', 'lgaName', 'quantityOnHand', 'expiresOn'))
      }
    }
  }, {
    method: 'GET',
    path: '/inventory/group-by-site',
    handler: asyncHandler(listInventoryItemsGroupedBySite),
    config: {
      description: 'List of Consumables on Hand Grouped by Site',
      notes: 'Pageable and sortable list of inventory items grouped by site',
      auth: { scope: ['inventory:view', 'inventory:edit'] },
      validate: {
        query: Object.assign(inventoryFilters,
          validateAllGeographyFilterParams(),
          validateDateRangeParams(),
          validateSortPageParams('consumableName', 'manufacturer', 'siteName', 'countryName', 'stateName', 'lgaName', 'quantityOnHand', 'expiresOn'))
      }
    }
  }
]
