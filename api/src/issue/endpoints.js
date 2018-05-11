const Joi = require('joi')
const { asyncHandler } = require('../routes')
const {
  updateIssueStatus,
  onIssueEventTrigger,
  onIssueEventResolve,
} = require('./service')
const { onEscalateIssues } = require('./escalations')

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

module.exports = { routes, subscriptions }
