const { onIssueEventTrigger, onIssueEventResolve } = require('./service')

const subscriptions = [
  {
    actions: {
      DEVICE_OFFLINE: onIssueEventTrigger('DeviceOffline'),
      DEVICE_ONLINE: onIssueEventResolve('DeviceOffline'),

      // passed string values should match externalId in table IssueType
      INVENTORY_STOCKOUT: onIssueEventTrigger('InventoryStockout'),
      INVENTORY_STOCK_EXPIRING: onIssueEventTrigger('InventoryStockExpiring'),

      RESULT_MODULE_TEMPERATURE_ERROR: onIssueEventTrigger(
        'ModuleTemperatureError'
      ),
      RESULT_MODULE_POWER_ERROR: onIssueEventTrigger('ModulePowerError'),
      RESULT_MODULE_FAILURE_ERROR: onIssueEventTrigger('ModuleFailureError'),
    },
  },
]

module.exports = { subscriptions }
