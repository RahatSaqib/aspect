const { onIssueEventTrigger, onIssueEventResolve } = require('./service')

const subscriptions = [
  {
    actions: {
      DEVICE_OFFLINE: onIssueEventTrigger('DeviceOffline'),
      DEVICE_ONLINE: onIssueEventResolve('DeviceOffline'),
      RESULT_MODULE_TEMPERATURE_ERROR: onIssueEventTrigger(
        'ModuleTemperatureError'
      ),
      RESULT_MODULE_POWER_ERROR: onIssueEventTrigger('ModulePowerError'),
      RESULT_MODULE_FAILURE_ERROR: onIssueEventTrigger('ModuleFailureError'),
      RESULT_DATA_CATEGORY_IS_LOW: onIssueEventTrigger('DataCategoryLow'),
    },
  },
]

module.exports = { subscriptions }
