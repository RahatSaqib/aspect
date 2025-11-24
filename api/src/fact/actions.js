const isNil = require('lodash/isNil')
// ----------- Action Types ---------------------
const types = {
  FACT_GENERATE_DEVICE_CONNECTIVITY: 'FACT_GENERATE_DEVICE_CONNECTIVITY',
  FACT_GENERATE_RESULT_COUNTS: 'FACT_GENERATE_RESULT_COUNTS',
  FACT_CHECK_INVENTORY_STOCK: 'FACT_CHECK_INVENTORY_STOCK',
  FACT_CALCULATE_INVENTORY_CONSUMPTION_RATES: 'FACT_CALCULATE_INVENTORY_CONSUMPTION_RATES',
  // for DataCategoryLow issue types
  FACT_DATA_CATEGORY_LOW_CHECK: 'FACT_DATA_CATEGORY_LOW_CHECK',
  FACT_DATA_CATEGORY_IS_LOW_HIVSTATUS: 'FACT_DATA_CATEGORY_IS_LOW_HIVSTATUS',
  FACT_DATA_CATEGORY_IS_LOW_PREVIOUSLYTREATED: 'FACT_DATA_CATEGORY_IS_LOW_PREVIOUSLYTREATED',
  FACT_DATA_CATEGORY_IS_LOW_MICROSCOPYRESULT: 'FACT_DATA_CATEGORY_IS_LOW_MICROSCOPYRESULT',
  FACT_DATA_CATEGORY_IS_LOW_OTHER: 'FACT_DATA_CATEGORY_IS_LOW_OTHER',
  FACT_NEW_RESULTS_AVAILABLE_CHECK: 'FACT_NEW_RESULTS_AVAILABLE_CHECK',
  FACT_NEW_RESULTS_AVAILABLE: 'FACT_NEW_RESULTS_AVAILABLE',
  FACT_CHECK_EXTERNAL_FACT_SOURCE: 'FACT_CHECK_EXTERNAL_FACT_SOURCE',
  FACT_FILL_CUSTOM_FIELDS_COMPLETION_STATS_LAST_30_DAYS: 'FACT_FILL_CUSTOM_FIELDS_COMPLETION_STATS_LAST_30_DAYS',
  FACT_CHECK_COMPLETION_RATE_PER_SITE: 'FACT_CHECK_COMPLETION_RATE_PER_SITE',
  SITE_WITH_LOW_COMPLETION_RATE: 'SITE_WITH_LOW_COMPLETION_RATE',
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
function factCheckCompletionRatePerSite() {
  return {
    type: types.FACT_CHECK_COMPLETION_RATE_PER_SITE,
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
 * categoryToken, categoryName, periodName, siteId, percentage are required.
 */
function factDataCategoryLow({ categoryToken, categoryName, periodName, siteId, percentage }) {
  if (!categoryToken || !categoryName || !periodName || !siteId || isNil(percentage)) {
    throw new Error(
      'Must specify each parameter - categoryToken, categoryName, periodName, siteId, percentage - for Data Category Low notification'
    )
  }
  return {
    type: types[`FACT_DATA_CATEGORY_IS_LOW_${categoryToken.toUpperCase()}`],
    siteId,
    options: {
      categoryToken,
      categoryName,
      periodName,
      siteId,
      percentage,
    },
  }
}

/**
 * Requests checking for new results. Will be called on
 * schedule to run fact ETL
 */
function factNewResultsAvailableCheck() {
  return {
    type: types.FACT_NEW_RESULTS_AVAILABLE_CHECK,
  }
}

/**
 * Creates an action to notify the origin site with given id
 * has new results available
 *
 * categoryToken, categoryName, periodName, siteId, percentage are required.
 */
function factNewResultsAvailable({ siteId, numberOfResults }) {
  if (!siteId || !numberOfResults) {
    throw new Error('Must specify siteId and numberOfResults - for new results available')
  }
  return {
    type: types.FACT_NEW_RESULTS_AVAILABLE,
    siteId,
    options: {
      siteId,
      numberOfResults,
    },
  }
}

function siteWithLowCompletionRateIssue({ siteId, geographyId, partnerId, completionRatePerSite: completionRate }) {
  if (!siteId || isNil(completionRate)) {
    throw new Error('Must specify siteId and completionRate for new Evaluation')
  }
  return {
    type: types.SITE_WITH_LOW_COMPLETION_RATE,
    siteId,
    geographyId,
    partnerId,
    options: {
      completionRate,
      completionRatePercentage: (completionRate * 100).toFixed(2),
    },
  }
}

/**
 * Creates an action to fill custom fields completions
 * for last 30 days
 */
function factFillCustomFieldsCompletionStatsLast30Days() {
  return {
    type: types.FACT_FILL_CUSTOM_FIELDS_COMPLETION_STATS_LAST_30_DAYS,
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
  factNewResultsAvailableCheck,
  factNewResultsAvailable,
  factCheckCompletionRatePerSite,
  siteWithLowCompletionRateIssue,
  factFillCustomFieldsCompletionStatsLast30Days,
}
