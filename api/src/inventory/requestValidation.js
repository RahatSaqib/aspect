const Joi = require('@hapi/joi')
const { validateAllGeographyFilterParams } = require('../geography/requestValidation')
const { validateDateRangeParams, validateSortPageParams } = require('../routes')
const { REGEX_ISODATESTRING } = require('../shared/date')

const inventoryFilters = {
  siteIds: Joi.string().allow('', null),
  siteId: Joi.number().integer().positive().allow('', null),
  consumableId: Joi.number().integer().positive().allow('', null),
  consumableExternalId: Joi.string().optional().allow('', null).description('The external id of the consumable item'),
  siteName: Joi.string().allow('', null),
  lotNumber: Joi.string().allow('', null),
  daysStockLeft: Joi.string().allow('', null),
  breakOutByLot: Joi.bool().allow(null),
  hasStock: Joi.bool().allow(null),
  onlyTransfers: Joi.bool().allow(null).optional(),
  minExpirationDate: Joi.string().pattern(REGEX_ISODATESTRING).allow(null).description('From Date'),
  maxExpirationDate: Joi.string().pattern(REGEX_ISODATESTRING).allow(null).description('To Date'),
}
const inventoryReconciliationFilters = {
  siteName: Joi.string().allow('', null),
  siteIds: Joi.string().allow('', null),
  breakOutByLot: Joi.bool().allow(null),
  consumableId: Joi.number().integer().positive().allow('', null),
  lotNumber: Joi.string().allow('', null),
  minExpirationDate: Joi.string().pattern(REGEX_ISODATESTRING).allow(null).description('From Date'),
  maxExpirationDate: Joi.string().pattern(REGEX_ISODATESTRING).allow(null).description('To Date'),
}

const inventoryTransferFilters = {
  originSiteIds: Joi.array().items(Joi.number()),
  originSiteName: Joi.string().allow('', null),
  destinationSiteName: Joi.string().allow('', null),
  consumableId: Joi.number().integer().positive().allow('', null),
  consumableName: Joi.string().allow('', null),
}

const adjustInventoryCommonPayloadFields = {
  consumableId: Joi.number().positive().required(),
  lotNumber: Joi.string().max(255).allow('', null),
  expiresOn: Joi.string(),
  quantity: Joi.number().positive().required(),
  notes: Joi.string().max(2000).allow('', null),
}

const removeInventoryCommonPayloadFields = {
  ...adjustInventoryCommonPayloadFields,
  fromSiteId: Joi.number().integer().positive().required(),
  reasonId: Joi.number().integer().positive().required(),
}

const modifyInventoryCommonPayloadFields = {
  siteId: Joi.number().integer().positive().required(),
  consumableId: Joi.number().integer().positive().required(),
  quantity: Joi.number().required(),
  lotNumber: Joi.string().max(255).optional().allow('', null),
  expiresOn: Joi.date().optional().allow('', null),
  notes: Joi.string().max(2000).required(),
}

function listSuppliesBaseConfig() {
  return {
    auth: { scope: ['inventory:view', 'operationalData:view'] },
    validate: {
      query: {
        format: Joi.string().allow('').description('File format for exporting data'),
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
          'lotNumber',
          'quantityOnHand',
          'expiresOn',
          'daysStockLeft',
          'dailyConsumptionRate'
        ),
      },
    },
  }
}

module.exports = {
  listSuppliesBaseConfig,
  modifyInventoryCommonPayloadFields,
  removeInventoryCommonPayloadFields,
  adjustInventoryCommonPayloadFields,
  inventoryFilters,
  inventoryReconciliationFilters,
  inventoryTransferFilters,
}
