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
  addInventory,
  removeInventory,
  transferInventory,
  receiveInventory
} = require('./service')

const inventoryFilters = {
  consumableId: Joi.number().integer().positive().allow('', null),
  siteName: Joi.string().allow('', null)
}

const adjustInventoryCommonParamsFields = {
  inventoryItemId: Joi.number().integer().positive().required()
}

const adjustInventoryCommonPayloadFields = {
  lotNumber: Joi.string().max(255).allow('', null),
  expiresOn: Joi.date().iso().allow(null),
  quantity: Joi.number().positive().required(),
  notes: Joi.string().max(2000).allow('', null)
}

const removeInventoryCommonPayloadFields = Object.assign({},
  adjustInventoryCommonPayloadFields, {
    fromSiteId: Joi.number().integer().positive().required(),
    reasonId: Joi.number().integer().positive().required()
  })

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
        query: Object.assign({}, inventoryFilters,
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
        query: Object.assign({}, inventoryFilters,
          validateAllGeographyFilterParams(),
          validateDateRangeParams(),
          validateSortPageParams('consumableName', 'manufacturer', 'siteName', 'countryName', 'stateName', 'lgaName', 'quantityOnHand', 'expiresOn'))
      }
    }
  }, {
    method: 'PUT',
    path: '/inventory/add/{inventoryItemId}',
    handler: asyncHandler(addInventory),
    config: {
      description: 'Add Inventory',
      notes: 'Adds quantity to inventory item at site',
      auth: { scope: ['inventory:edit'] },
      validate: {
        params: adjustInventoryCommonParamsFields,
        payload: Object.assign({},
          adjustInventoryCommonPayloadFields, {
            toSiteId: Joi.number().integer().positive().required(),
            dateAdjusted: Joi.date().iso().required()
          })
      }
    }
  }, {
    method: 'PUT',
    path: '/inventory/remove/{inventoryItemId}',
    handler: asyncHandler(removeInventory),
    config: {
      description: 'Remove Inventory',
      notes: 'Removes quantity from inventory item at site',
      auth: { scope: ['inventory:edit'] },
      validate: {
        params: adjustInventoryCommonParamsFields,
        payload: Joi.alternatives().try(
          Joi.object().keys(Object.assign({},
            removeInventoryCommonPayloadFields, {
              dateAdjusted: Joi.date().iso().required()
            })),
          Object.assign({},
            removeInventoryCommonPayloadFields, {
              dateAdjustedFrom: Joi.date().iso().required(),
              dateAdjustedTo: Joi.date().iso().required()
            }))
      }
    }
  }, {
    method: 'PUT',
    path: '/inventory/transfer/{inventoryItemId}',
    handler: asyncHandler(transferInventory),
    config: {
      description: 'Transfer Inventory',
      notes: 'Transfers quantity from inventory item to in transit',
      auth: { scope: ['inventory:edit'] },
      validate: {
        params: adjustInventoryCommonParamsFields,
        payload: Object.assign({},
          adjustInventoryCommonPayloadFields, {
            fromSiteId: Joi.number().integer().positive().required(),
            toSiteId: Joi.number().integer().positive().required(),
            dateAdjusted: Joi.date().iso().required()
          })
      }
    }
  }, {
    method: 'PUT',
    path: '/inventory/receive/{inventoryItemId}',
    handler: asyncHandler(receiveInventory),
    config: {
      description: 'Receive Inventory',
      notes: 'Received quantity from inventory item in transit',
      auth: { scope: ['inventory:edit'] },
      validate: {
        params: adjustInventoryCommonParamsFields,
        payload: Object.assign({},
          adjustInventoryCommonPayloadFields, {
            fromSiteId: Joi.number().integer().positive().required(),
            toSiteId: Joi.number().integer().positive().required(),
            dateAdjusted: Joi.date().iso().required()
          })
      }
    }
  }
]
