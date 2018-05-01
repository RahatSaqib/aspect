const { onIssueEventTrigger, onIssueEventResolve } = require('./service')

const subscriptions = [
  {
    actions: {
      DEVICE_OFFLINE: onIssueEventTrigger('DeviceOffline'),
      DEVICE_ONLINE: onIssueEventResolve('DeviceOffline'),

      // passed string values should match externalId in table IssueType
      INVENTORY_STOCKOUT: onIssueEventTrigger('InventoryStockout'),
      INVENTORY_STOCK_EXPIRING: onIssueEventTrigger('InventoryStockExpiring'),
    },
  },
]

module.exports = { subscriptions }
