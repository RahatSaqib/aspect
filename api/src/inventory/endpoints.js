const Joi = require('@hapi/joi')
const { validateAllGeographyFilterParams } = require('../geography/requestValidation')
const { asyncHandler, validateDateRangeParams, validateSortPageParams } = require('../routes')
const {
  listInventoryGroupedBySite,
  addInventory,
  removeInventory,
  transferInventory,
  receiveInventory,
  getDaysByLocation,
  modifyInventoryOnHand,
} = require('./service')
const listInventory = require('./listInventory')
const listInventoryLog = require('./inventoryLog')
const { exportSupplies } = require('./serviceReports')
const {
  listSuppliesBaseConfig,
  adjustInventoryCommonPayloadFields,
  removeInventoryCommonPayloadFields,
  modifyInventoryCommonPayloadFields,
  inventoryFilters,
} = require('./requestValidation')

const routes = [
  {
    method: 'GET',
    path: '/inventory',
    handler: asyncHandler(listInventory),
    config: {
      description: 'List of Consumables on Hand At Site',
      notes: 'Pageable and sortable list of inventory items',
      auth: { scope: ['inventory:view'] },
      validate: {
        query: {
          ...inventoryFilters,
          ...validateAllGeographyFilterParams(),
          ...validateDateRangeParams(),
          ...validateSortPageParams(
            'consumableName',
            'manufacturer',
            'siteName',
            'countryName',
            'stateName',
            'lgaName',
            'quantityOnHand',
            'expiresOn',
            'daysStockLeft',
            'projectedWaste',
            'dailyConsumptionRate',
            'lotNumber'
          ),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/inventory/log',
    handler: asyncHandler(listInventoryLog),
    config: {
      description: 'List of Inventory Transactions',
      notes: 'Pageable and sortable list of inventory transactions',
      auth: { scope: ['inventory:view'] },
      validate: {
        query: {
          ...inventoryFilters,
          ...validateAllGeographyFilterParams(),
          ...validateDateRangeParams(),
          ...validateSortPageParams(
            'createdOn',
            'siteName',
            'lotNumber',
            'notes',
            'movementReason',
            'consumableName',
            'expiresOn',
            'quantity'
          ),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/inventory/group-by-site',
    handler: asyncHandler(listInventoryGroupedBySite),
    config: {
      description: 'List of Consumables on Hand Grouped by Site',
      notes: 'Pageable and sortable list of inventory items grouped by site',
      ...listSuppliesBaseConfig(),
    },
  },
  {
    method: 'GET',
    path: '/inventory/export',
    handler: exportSupplies,
    config: {
      description: 'Export Supplies List into Excel or CSV',
      notes: 'Filtered and sorted list of supplies',
      ...listSuppliesBaseConfig(),
    },
  },
  {
    method: 'POST',
    path: '/inventory/add',
    handler: asyncHandler(addInventory),
    config: {
      description: 'Add Inventory',
      notes: 'Adds an inventory item at a site',
      auth: { scope: ['inventory:edit'] },
      validate: {
        payload: {
          ...adjustInventoryCommonPayloadFields,
          toSiteId: Joi.number().integer().positive().required(),
          dateAdjusted: Joi.date().iso().required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/inventory/days-by-location',
    handler: asyncHandler(getDaysByLocation),
    config: {
      description: 'Get inventories availability by location',
      notes: 'Returns list of inventory counts grouped by site/geography/state/lga',
      ...listSuppliesBaseConfig(),
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False on any non-fatal error'),
          total: Joi.number().required().description('The total number of items aggregated by consumable'),
          data: Joi.array()
            .allow(null)
            .items(
              Joi.object().keys({
                consumableId: Joi.number().description('The consumable id'),
                consumableExternalId: Joi.number().description('The consumable external id'),
                consumableName: Joi.string().description('The consumable name'),

                outOfStock: Joi.number().description('Number of locations which are out of stock'),
                upTo14: Joi.number().description('Number of locations with inventories up to 14 days in stock'),
                upTo30: Joi.number().description('Number of locations with inventories up to 30 days in stock'),
                upTo90: Joi.number().description('Number of locations with inventories up to 90 days in stock'),
                upTo180: Joi.number().description('Number of locations with inventories up to 180 days in stock'),
                moreThan180: Joi.number().description(
                  'Number of locations with inventories for more than 180 days in stock'
                ),
                notRecorded: Joi.number().description('Number of locations with no recorded inventories in stock'),
                noConsumption: Joi.number().description(
                  'Number of locations which have not been consumed inventories so far'
                ),
              })
            ),
        }),
      },
    },
  },
  {
    method: 'PUT',
    path: '/inventory/add',
    handler: asyncHandler(addInventory),
    config: {
      description: 'Add Inventory',
      notes: 'Adds quantity to inventory item at site',
      auth: { scope: ['inventory:edit'] },
      validate: {
        payload: {
          ...adjustInventoryCommonPayloadFields,
          toSiteId: Joi.number().integer().positive().required(),
          dateAdjusted: Joi.date().iso().required(),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/inventory/remove',
    handler: asyncHandler(removeInventory),
    config: {
      description: 'Remove Inventory',
      notes: 'Removes quantity from inventory item at site',
      auth: { scope: ['inventory:edit'] },
      validate: {
        payload: Joi.alternatives().try(
          Joi.object().keys({
            ...removeInventoryCommonPayloadFields,
            dateAdjusted: Joi.date().iso().required(),
          }),
          {
            ...removeInventoryCommonPayloadFields,
            dateAdjustedFrom: Joi.date().iso().required(),
            dateAdjustedTo: Joi.date().iso().required(),
          }
        ),
      },
    },
  },
  {
    method: 'PUT',
    path: '/inventory/transfer',
    handler: asyncHandler(transferInventory),
    config: {
      description: 'Transfer Inventory',
      notes: 'Transfers quantity from inventory item to in transit',
      auth: { scope: ['inventory:edit'] },
      validate: {
        payload: {
          ...adjustInventoryCommonPayloadFields,
          fromSiteId: Joi.number().integer().positive().required(),
          toSiteId: Joi.number().integer().positive().required(),
          dateAdjusted: Joi.date().iso().required(),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/inventory/receive',
    handler: asyncHandler(receiveInventory),
    config: {
      description: 'Receive Inventory',
      notes: 'Received quantity from inventory item in transit',
      auth: { scope: ['inventory:edit'] },
      validate: {
        payload: {
          ...adjustInventoryCommonPayloadFields,
          fromSiteId: Joi.number().integer().positive().required(),
          toSiteId: Joi.number().integer().positive().required(),
          dateAdjusted: Joi.date().iso().required(),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/inventory/on-hand',
    handler: asyncHandler(modifyInventoryOnHand),
    config: {
      description: 'Modify Inventory on Hand',
      notes: 'Received quantity to modify inventory',
      auth: { scope: ['inventory:edit'] },
      validate: {
        payload: {
          ...modifyInventoryCommonPayloadFields,
        },
      },
    },
  },
]

module.exports = { routes }
