const Joi = require('joi')
const { asyncHandler } = require('../routes')
const {
  updateIssueStatus,
  onIssueEventTrigger,
  onIssueEventResolve,
} = require('./service')
const {
  onIssueCreated,
  onIssueTriggered,
  onEscalateIssues,
} = require('./escalations')
const { onResolveIssues } = require('./resolutions')

const routes = [
  {
    method: 'PUT',
    path: '/issue/status/{issueId}',
    handler: asyncHandler(updateIssueStatus),
    config: {
      description: 'Update Issue Status',
      notes: 'Update the status of an issue',
      auth: { scope: ['notification:edit'] },
      validate: {
        params: {
          issueId: Joi.number()
            .integer()
            .positive()
            .description('Issue Id'),
        },
        payload: {
          issueStatusExternalId: Joi.string().allow('Acknowledged'),
        },
      },
    },
  },
]

const subscriptions = [
  {
    actions: {
      DEVICE_OFFLINE: onIssueEventTrigger('DeviceOffline'),
      DEVICE_ONLINE: onIssueEventResolve('DeviceOffline'),
      // passed string values should match externalId in table IssueType
      INVENTORY_STOCKOUT: onIssueEventTrigger('InventoryStockout'),
      INVENTORY_STOCK_EXPIRING: onIssueEventTrigger('InventoryStockExpiring'),
      DEVICE_NO_RESULTS: onIssueEventTrigger('DeviceNoResults'),
      DEVICE_HAS_NEW_RESULTS: onIssueEventResolve('DeviceNoResults'),
      DEVICE_MAINTENANCE: onIssueEventTrigger('DeviceMaintenance'),
      DEVICE_MAINTENANCE_RESOLVED: onIssueEventResolve('DeviceMaintenance'),
      RESULT_MODULE_TEMPERATURE_ERROR: onIssueEventTrigger(
        'ModuleTemperatureError'
      ),
      RESULT_LOGGED: onIssueEventTrigger('ResultReceived'),
      RESULT_MODULE_POWER_ERROR: onIssueEventTrigger('ModulePowerError'),
      RESULT_MODULE_FAILURE_ERROR: onIssueEventTrigger('ModuleFailureError'),
      RESULT_MACHINE_TEMPERATURE_ERROR: onIssueEventTrigger(
        'MachineTemperatureError'
      ),
      RESULT_MACHINE_PROCEDURAL_ERROR: onIssueEventTrigger(
        'MachineProceduralError'
      ),
      RESULT_MODULE_PROCEDURAL_ERROR: onIssueEventTrigger(
        'ModuleProceduralError'
      ),
      INVENTORY_REAGENT_HEALTH: onIssueEventTrigger('ReagentHealthError'),
      RESULT_MACHINE_POWER_ERROR: onIssueEventTrigger('MachinePowerError'),
      ISSUE_CREATED: onIssueCreated,
      ISSUE_TRIGGERED: onIssueTriggered,
      ESCALATE_ISSUES: onEscalateIssues(),
      RESOLVE_ISSUES: onResolveIssues(),
    },
  },
]

module.exports = { routes, subscriptions }
