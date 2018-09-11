const isNil = require('lodash/isNil')
// ----------- Action Types ---------------------
const types = {
  FACT_GENERATE_DEVICE_CONNECTIVITY: 'FACT_GENERATE_DEVICE_CONNECTIVITY',
  FACT_GENERATE_RESULT_COUNTS: 'FACT_GENERATE_RESULT_COUNTS',
  FACT_CHECK_INVENTORY_STOCK: 'FACT_CHECK_INVENTORY_STOCK',
  FACT_CALCULATE_INVENTORY_CONSUMPTION_RATES:
    'FACT_CALCULATE_INVENTORY_CONSUMPTION_RATES',
  // for DataCategoryLow issue types
  FACT_DATA_CATEGORY_LOW_CHECK: 'FACT_DATA_CATEGORY_LOW_CHECK',
  FACT_DATA_CATEGORY_IS_LOW_HIVSTATUS: 'FACT_DATA_CATEGORY_IS_LOW_HIVSTATUS',
  FACT_DATA_CATEGORY_IS_LOW_PREVIOUSLYTREATED:
    'FACT_DATA_CATEGORY_IS_LOW_PREVIOUSLYTREATED',
  FACT_DATA_CATEGORY_IS_LOW_MICROSCOPYRESULT:
    'FACT_DATA_CATEGORY_IS_LOW_MICROSCOPYRESULT',
  FACT_DATA_CATEGORY_IS_LOW_OTHER: 'FACT_DATA_CATEGORY_IS_LOW_OTHER',
}

/**
 * Requests fact device flags to be regenerated for device connectivity.
 * Will be called on schedule to run fact device flag ETL
 *
 * deviceId: optional, if specified, request facts to be generated
 * for a specific device.
 * options: additional options, specific to the fact type,
 * intended for internal use of the fact service
 */
function factGenerateDeviceConnectivity(deviceId, options) {
  return {
    type: types.FACT_GENERATE_DEVICE_CONNECTIVITY,
    deviceId,
    options,
  }
}

/**
 * Requests fact device flags to be regenerated. Will be called on
 * schedule to run fact device flag ETL
 *
 * deviceId: optional, if specified, request facts to be generated
 * for a specific device.
 * options: additional options, specific to the fact type,
 * intended for internal use of the fact service
 */
function factGenerateResultCounts(deviceId, options) {
  return {
    type: types.FACT_GENERATE_RESULT_COUNTS,
    deviceId,
    options,
  }
}

/**
 * Requests facts to be regenerated. Will be called on
 * schedule to run fact ETL
 */
function factCheckInventoryStock() {
  return {
    type: types.FACT_CHECK_INVENTORY_STOCK,
  }
}

/**
 * Requests facts to be regenerated. Will be called on
 * schedule to run fact ETL
 */
function factCalculateInventoryConsumptionRates() {
  return {
    type: types.FACT_CALCULATE_INVENTORY_CONSUMPTION_RATES,
  }
}

/**
 * Creates an action to check data categories for 'low percentage' issue
 * Is called from scheduler
 */
function factDataCategoryLowCheck() {
  return {
    type: types.FACT_DATA_CATEGORY_LOW_CHECK,
  }
}

/**
 * Creates an action to notify the site with given id
 * has low given data category issue for given period
 *
 * dataCategoryId, categoryName, periodName, siteId, percentage are required.
 */
function factDataCategoryLow({
  dataCategoryId,
  categoryToken,
  categoryName,
  periodName,
  siteId,
  percentage,
}) {
  if (
    !dataCategoryId ||
    !categoryToken ||
    !categoryName ||
    !periodName ||
    !siteId ||
    isNil(percentage)
  ) {
    throw new Error(
      'Must specify each parameter - dataCategoryId, categoryToken, categoryName, periodName, siteId, percentage - for Data Category Low notification'
    )
  }
  return {
    type: types[`FACT_DATA_CATEGORY_IS_LOW_${categoryToken.toUpperCase()}`],
    siteId,
    options: {
      dataCategoryId,
      categoryName,
      periodName,
      siteId,
      percentage,
    },
  }
}

module.exports = {
  types,
  factGenerateDeviceConnectivity,
  factGenerateResultCounts,
  factCheckInventoryStock,
  factCalculateInventoryConsumptionRates,
  factDataCategoryLowCheck,
  factDataCategoryLow,
}
