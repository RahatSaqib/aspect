const Joi = require('@hapi/joi')
const { validateAllGeographyFilterParams } = require('../geography/requestValidation')
const { asyncHandler, validateDateRangeParams, validateSortPageParams } = require('../routes')
const getDaysByLocation = require('./getDaysByLocation')
const modifyInventoryOnHand = require('./modifyInventoryOnHand')
const addInventory = require('./addInventory')
const removeInventory = require('./removeInventory')
const transferInventory = require('./transferInventory')
const receiveInventory = require('./receiveInventory')
const listInventory = require('./listInventory')
const { listReconciliation } = require('./listReconciliation')
const { autoReconcile } = require('./autoReconcile')
const getInventoryOverview = require('./getInventoryOverview')
const listInventoryLog = require('./listInventoryLog')
const listInventoryTransfer = require('./listInventoryTransfer')
const exportInventoryTransfer = require('./exportInventoryTransfer')
const { exportSupplies, exportReconciliation } = require('./serviceReports')
const updateConsumableSitesBatch = require('./updateConsumableSitesBatch')
const {
  listSuppliesBaseConfig,
  adjustInventoryCommonPayloadFields,
  removeInventoryCommonPayloadFields,
  modifyInventoryCommonPayloadFields,
  inventoryFilters,
  inventoryReconciliationFilters,
  inventoryTransferFilters,
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
    path: '/inventory/reconciliation',
    handler: asyncHandler(listReconciliation),
    config: {
      description: 'List of Unreconciled Inventory',
      notes: 'Pageable and sortable list of unreconciled inventories',
      auth: { scope: ['inventory:view'] },
      validate: {
        query: {
          ...inventoryReconciliationFilters,
          ...validateAllGeographyFilterParams(),
          ...validateDateRangeParams(),
          ...validateSortPageParams(
            'consumableName',
            'siteName',
            'stateName',
            'lgaName',
            'quantity',
            'expiresOn',
            'lotNumber'
          ),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/inventory/reconciliation/export',
    handler: asyncHandler(exportReconciliation),
    config: {
      description: 'Export List of Reconciliation',
      notes: 'Pageable and sortable list of reconciliation',
      auth: { scope: ['inventory:view'] },
      validate: {
        query: {
          format: Joi.string().allow('').description('File format for exporting data'),
          ...inventoryReconciliationFilters,
          ...validateAllGeographyFilterParams(),
          ...validateSortPageParams(
            'consumableName',
            'siteName',
            'stateName',
            'lgaName',
            'quantity',
            'expiresOn',
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
            'quantity',
            'transactionDate'
          ),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/inventory/overview',
    handler: asyncHandler(getInventoryOverview),
    config: {
      description: 'Hierarchical view of inventory',
      notes: 'Hierarchical view of inventory',
      auth: { scope: ['inventory:view'] },
      validate: {
        query: {
          consumableExternalId: Joi.string().allow('', null),
          minDate: Joi.date().iso().allow(null).description('From Date'),
          maxDate: Joi.date().iso().allow(null).description('To Date'),
        },
      },
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
          reasonId: Joi.number().integer().positive().required(),
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
          reasonId: Joi.number().integer().positive().required(),
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
        payload: Joi.object().keys({
          ...removeInventoryCommonPayloadFields,
          dateAdjusted: Joi.date().iso().required(),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/inventory/transfer',
    handler: asyncHandler(listInventoryTransfer),
    config: {
      description: 'Transfer Inventory History',
      notes: 'Pageable and sortable list of inventory transfers',
      auth: { scope: ['inventory:view'] },
      validate: {
        query: {
          ...inventoryTransferFilters,
          ...validateDateRangeParams(),
          ...validateAllGeographyFilterParams(),
          ...validateSortPageParams(
            'sentQuantity',
            'sentOn',
            'receivedQuantity',
            'receivedOn',
            'lotNumber',
            'expirationDate',
            'originSiteName',
            'destinationSiteName',
            'consumableName',
            'consumableNameI18nKey'
          ),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/inventory/transfer/export',
    handler: exportInventoryTransfer,
    config: {
      description: 'Export Inventory Transfer List into Excel or CSV',
      auth: { scope: ['inventory:view'] },
      validate: {
        query: {
          format: Joi.string().allow('').description('File format for exporting data'),
          ...inventoryTransferFilters,
          ...validateDateRangeParams(),
          ...validateAllGeographyFilterParams(),
        },
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
  {
    method: 'POST',
    path: '/inventory/auto-reconcile',
    handler: asyncHandler(autoReconcile),
    config: {
      description: 'Reconcile the Unreconciled Inventory',
      notes: 'Only Reconcile the filtered inventory',
      auth: { scope: ['inventory:edit'] },
      validate: {
        payload: {
          ...inventoryReconciliationFilters,
          ...validateAllGeographyFilterParams(),
          ...validateDateRangeParams(),
          ...validateSortPageParams(
            'consumableName',
            'siteName',
            'stateName',
            'lgaName',
            'quantity',
            'expiresOn',
            'lotNumber'
          ),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/inventory/consumable-sites/{consumableId}',
    handler: asyncHandler(updateConsumableSitesBatch),
    config: {
      description: 'Update Consumable Sites Batch',
      notes: 'Update multiple sites for a single consumable in a single atomic operation',
      auth: { scope: ['inventory:edit'] },
      validate: {
        params: {
          consumableId: Joi.number().integer().positive().description('Consumable id').required(),
        },
        payload: {
          siteIds: Joi.array().items(Joi.number().integer().positive()).required(),
        },
      },
    },
  },
]

module.exports = { routes }
