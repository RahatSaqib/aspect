import { notificationCategories as messages } from '../../messages'

export const notificationCategories = [
  {
    i18Name: messages.notificationTypeResultBased,
    id: 'resultBased=category',
  },
  {
    i18Name: messages.notificationTypeReportBased,
    id: 'reportBased=category',
  },
  {
    i18Name: messages.notificationTypeIssuedBased,
    id: 'issueBased=category',
  },
  {
    i18Name: messages.notificationTypeLowInventory,
    id: 'InventoryStockout=issue',
  },
  {
    i18Name: messages.notificationTypeLowFieldCompletionRate,
    id: 'SiteWithLowFieldCompletionRate=issue',
  },
  {
    i18Name: messages.notificationTypeInventoryExpiring,
    id: 'InventoryStockExpiring=issue',
  },
  {
    i18Name: messages.notificationTypeNoResult,
    id: 'DeviceNoResults=issue',
  },
  {
    i18Name: messages.notificationTypeOffline,
    id: 'DeviceOffline=issue',
  },
  {
    i18Name: messages.notificationTypeCalibrationDueDate,
    id: 'CalibrationDueDate=issue',
  },
  {
    i18Name: messages.notificationTypeModuleReplaced,
    id: 'ModuleReplaced=issue',
  },
  {
    i18Name: messages.notificationTypeModuleDisabled,
    id: 'ModuleDisabled=issue',
  },
  {
    i18Name: messages.notificationTypeModuleUnused,
    id: 'UnusedModules=issue',
  },
]
