const {
  onFactGenerateDeviceConnectivity,
  onFactGenerateResultCounts,
  onFactCheckInventoryStock,
  onFactCalculateInventoryConsumptionRates,
  onDeviceSeen,
  onDeviceUpdateFlag,
  onResultLogged,
  checkDataCategoriesForLowStatus,
} = require('./service')

const subscriptions = [
  {
    actions: {
      FACT_GENERATE_DEVICE_CONNECTIVITY: onFactGenerateDeviceConnectivity,
      FACT_GENERATE_RESULT_COUNTS: onFactGenerateResultCounts,
      FACT_CHECK_INVENTORY_STOCK: onFactCheckInventoryStock,
      FACT_CALCULATE_INVENTORY_CONSUMPTION_RATES: onFactCalculateInventoryConsumptionRates,
      DEVICE_SEEN: onDeviceSeen,
      DEVICE_ONLINE: onDeviceUpdateFlag({ offline: 0 }),
      DEVICE_OFFLINE: onDeviceUpdateFlag({ offline: 1 }),
      DEVICE_MAINTENANCE: onDeviceUpdateFlag({ maintenance: 1 }),
      DEVICE_MAINTENANCE_RESOLVED: onDeviceUpdateFlag({ maintenance: 0 }),
      DEVICE_HAS_NEW_RESULTS: onDeviceUpdateFlag({ noResults: 0 }),
      DEVICE_NO_RESULTS: onDeviceUpdateFlag({ noResults: 1 }),
      RESULT_LOGGED: onResultLogged,
      FACT_DATA_CATEGORY_LOW_CHECK: checkDataCategoriesForLowStatus,
    },
  },
]

module.exports = { subscriptions }
