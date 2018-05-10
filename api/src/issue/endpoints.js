const { onIssueEventTrigger, onIssueEventResolve } = require('./service')
const { onEscalateIssues } = require('./escalations')

const subscriptions = [
  {
    actions: {
      DEVICE_OFFLINE: onIssueEventTrigger('DeviceOffline'),
      DEVICE_ONLINE: onIssueEventResolve('DeviceOffline'),
      DEVICE_NO_RESULTS: onIssueEventTrigger('DeviceNoResults'),
      DEVICE_HAS_NEW_RESULTS: onIssueEventResolve('DeviceNoResults'),
      RESULT_MODULE_TEMPERATURE_ERROR: onIssueEventTrigger(
        'ModuleTemperatureError'
      ),
      RESULT_MODULE_POWER_ERROR: onIssueEventTrigger('ModulePowerError'),
      RESULT_MODULE_FAILURE_ERROR: onIssueEventTrigger('ModuleFailureError'),
      RESULT_MACHINE_TEMPERATURE_ERROR: onIssueEventTrigger(
        'MachineTemperatureError'
      ),
      RESULT_MODULE_GENERIC_ERROR: onIssueEventTrigger('ModuleGenericError'),
      ESCALATE_ISSUES: onEscalateIssues(),
    },
  },
]

module.exports = { subscriptions }
