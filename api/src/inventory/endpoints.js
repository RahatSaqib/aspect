const Joi = require('@hapi/joi')
const {
  validateAllGeographyFilterParams,
} = require('../geography/requestValidation')
const {
  asyncHandler,
  validateDateRangeParams,
  validateSortPageParams,
} = require('../routes')
const {
  listInventoryItems,
  listInventoryItemsGroupedBySite,
  addInventory,
  removeInventory,
  transferInventory,
  receiveInventory,
  updateInventoryStockLevel,
  getDaysByLocation,
} = require('./service')

const { getSuppliesReport } = require('./serviceReports')

const inventoryFilters = {
  consumableId: Joi.number()
    .integer()
    .positive()
    .allow('', null),
  siteName: Joi.string().allow('', null),
}

const addRemoveInventoryCommonParams = {
  inventoryItemId: Joi.number()
    .integer()
    .positive()
    .allow('', null),
}

const transferReceiveInventoryCommonParams = {
  inventoryItemId: Joi.number()
    .integer()
    .positive()
    .required(),
}

const adjustInventoryCommonPayloadFields = {
  consumableId: Joi.number()
    .positive()
    .required(),
  lotNumber: Joi.string()
    .max(255)
    .allow('', null),
  expiresOn: Joi.date()
    .iso()
    .allow(null),
  quantity: Joi.number()
    .positive()
    .required(),
  notes: Joi.string()
    .max(2000)
    .allow('', null),
}

const removeInventoryCommonPayloadFields = Object.assign(
  {},
  adjustInventoryCommonPayloadFields,
  {
    fromSiteId: Joi.number()
      .integer()
      .positive()
      .required(),
    reasonId: Joi.number()
      .integer()
      .positive()
      .required(),
  }
)

function listSuppliesBaseConfig() {
  return {
    auth: { scope: ['inventory:view', 'inventory:edit'] },
    validate: {
      query: Object.assign(
        {
          format: Joi.string()
            .allow('')
            .description('File format for exporting data'),
        },
        inventoryFilters,
        validateAllGeographyFilterParams(),
        validateDateRangeParams(),
        validateSortPageParams(
          'consumableName',
          'manufacturer',
          'siteName',
          'countryName',
          'stateName',
          'lgaName',
          'quantityOnHand',
          'expiresOn'
        )
      ),
    },
  }
}

const routes = [
  {
    method: 'GET',
    path: '/inventory',
    handler: asyncHandler(listInventoryItems),
    config: {
      description: 'List of Consumables on Hand At Site',
      notes: 'Pageable and sortable list of inventory items',
      auth: { scope: ['inventory:view', 'inventory:edit'] },
      validate: {
        query: Object.assign(
          {},
          inventoryFilters,
          validateAllGeographyFilterParams(),
          validateDateRangeParams(),
          validateSortPageParams(
            'consumableName',
            'manufacturer',
            'siteName',
            'countryName',
            'stateName',
            'lgaName',
            'quantityOnHand',
            'expiresOn'
          )
        ),
      },
    },
  },
  {
    method: 'GET',
    path: '/inventory/group-by-site',
    handler: asyncHandler(listInventoryItemsGroupedBySite),
    config: Object.assign(
      {
        description: 'List of Consumables on Hand Grouped by Site',
        notes: 'Pageable and sortable list of inventory items grouped by site',
      },
      listSuppliesBaseConfig()
    ),
  },
  {
    method: 'GET',
    path: '/inventory/export',
    handler: getSuppliesReport,
    config: Object.assign(
      {
        description: 'Export Supplies List into Excel or CSV',
        notes: 'Filtered and sorted list of supplies',
      },
      listSuppliesBaseConfig()
    ),
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
        payload: Object.assign({}, adjustInventoryCommonPayloadFields, {
          toSiteId: Joi.number()
            .integer()
            .positive()
            .required(),
          dateAdjusted: Joi.date()
            .iso()
            .required(),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/inventory/days-by-location',
    handler: asyncHandler(getDaysByLocation),
    config: {
      description: 'Get inventories availability by location',
      notes:
        'Returns list of inventory counts grouped by site/geography/state/lga',
      ...listSuppliesBaseConfig(),
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool()
            .required()
            .description('False on any non-fatal error'),
          total: Joi.number()
            .required()
            .description('The total number of items aggregated by consumable'),
          data: Joi.array()
            .allow(null)
            .items(
              Joi.object().keys({
                consumableId: Joi.number().description('The consumable id'),
                consumableName: Joi.string().description('The consumable name'),

                outOfStock: Joi.number().description(
                  'Number of locations which are out of stock'
                ),
                upTo14: Joi.number().description(
                  'Number of locations with inventories up to 14 days in stock'
                ),
                upTo30: Joi.number().description(
                  'Number of locations with inventories up to 30 days in stock'
                ),
                upTo90: Joi.number().description(
                  'Number of locations with inventories up to 90 days in stock'
                ),
                upTo180: Joi.number().description(
                  'Number of locations with inventories up to 180 days in stock'
                ),
                moreThan180: Joi.number().description(
                  'Number of locations with inventories for more than 180 days in stock'
                ),
                notRecorded: Joi.number().description(
                  'Number of locations with no recorded inventories in stock'
                ),
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
    path: '/inventory/add/{inventoryItemId}',
    handler: asyncHandler(addInventory),
    config: {
      description: 'Add Inventory',
      notes: 'Adds quantity to inventory item at site',
      auth: { scope: ['inventory:edit'] },
      validate: {
        params: addRemoveInventoryCommonParams,
        payload: Object.assign({}, adjustInventoryCommonPayloadFields, {
          toSiteId: Joi.number()
            .integer()
            .positive()
            .required(),
          dateAdjusted: Joi.date()
            .iso()
            .required(),
        }),
      },
    },
  },
  {
    method: 'PUT',
    path: '/inventory/remove/{inventoryItemId}',
    handler: asyncHandler(removeInventory),
    config: {
      description: 'Remove Inventory',
      notes: 'Removes quantity from inventory item at site',
      auth: { scope: ['inventory:edit'] },
      validate: {
        params: addRemoveInventoryCommonParams,
        payload: Joi.alternatives().try(
          Joi.object().keys(
            Object.assign({}, removeInventoryCommonPayloadFields, {
              dateAdjusted: Joi.date()
                .iso()
                .required(),
            })
          ),
          Object.assign({}, removeInventoryCommonPayloadFields, {
            dateAdjustedFrom: Joi.date()
              .iso()
              .required(),
            dateAdjustedTo: Joi.date()
              .iso()
              .required(),
          })
        ),
      },
    },
  },
  {
    method: 'PUT',
    path: '/inventory/transfer/{inventoryItemId}',
    handler: asyncHandler(transferInventory),
    config: {
      description: 'Transfer Inventory',
      notes: 'Transfers quantity from inventory item to in transit',
      auth: { scope: ['inventory:edit'] },
      validate: {
        params: transferReceiveInventoryCommonParams,
        payload: Object.assign({}, adjustInventoryCommonPayloadFields, {
          fromSiteId: Joi.number()
            .integer()
            .positive()
            .required(),
          toSiteId: Joi.number()
            .integer()
            .positive()
            .required(),
          dateAdjusted: Joi.date()
            .iso()
            .required(),
        }),
      },
    },
  },
  {
    method: 'PUT',
    path: '/inventory/receive/{inventoryItemId}',
    handler: asyncHandler(receiveInventory),
    config: {
      description: 'Receive Inventory',
      notes: 'Received quantity from inventory item in transit',
      auth: { scope: ['inventory:edit'] },
      validate: {
        params: transferReceiveInventoryCommonParams,
        payload: Object.assign({}, adjustInventoryCommonPayloadFields, {
          fromSiteId: Joi.number()
            .integer()
            .positive()
            .required(),
          toSiteId: Joi.number()
            .integer()
            .positive()
            .required(),
          dateAdjusted: Joi.date()
            .iso()
            .required(),
        }),
      },
    },
  },
  {
    method: 'PUT',
    path: '/inventory/{siteId}/{consumableId}',
    handler: asyncHandler(updateInventoryStockLevel),
    config: {
      description: 'Update Inventory Stock Level At Site',
      notes: 'Update the total quantity of a consumable at site',
      auth: { scope: ['inventory:edit'] },
      validate: {
        params: {
          siteId: Joi.number()
            .integer()
            .positive()
            .required(),
          consumableId: Joi.number()
            .integer()
            .positive()
            .required(),
        },
        payload: {
          quantity: Joi.number()
            .min(0)
            .required(),
        },
      },
    },
  },
]

module.exports = { routes }
