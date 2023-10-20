const onCalibrationDueDateAnalysis = require('./calibrationDueDateAnalysis')
const onCalibrationIssueNotificationTrigger = require('./calibrationIssueNotificationTrigger')
const onCalibrationDateUpdated = require('./calibrationDateUpdated')
const { taskTracker } = require('../scheduler/taskTracker')
const {
  onDeviceMaintenanceStatusLogged,
  onResultLogged,
  onDeviceUpdateMaintenanceStatus,
  onDeviceUpdateMaintenanceStatusNoResults,
  onDeviceMaintenanceResolved,
  onDeviceMaintenanceStatusLogScheduled,
  onDeviceUpdateModuleSerials,
} = require('./service')

const subscriptions = [
  {
    actions: {
      CALIBRATION_ISSUE_NOTIFICATION_TRIGGER: onCalibrationIssueNotificationTrigger,
      CALIBRATION_DUE_DATE_ANALYSIS: onCalibrationDueDateAnalysis,
      CALIBRATION_DATE_UPDATED: onCalibrationDateUpdated,
      DEVICE_MAINTENANCE_STATUS_LOGGED: onDeviceMaintenanceStatusLogged,
      RESULT_LOGGED: onResultLogged,
      DEVICE_MAINTENANCE: onDeviceUpdateMaintenanceStatus,
      DEVICE_NO_RESULTS: onDeviceUpdateMaintenanceStatusNoResults,
      DEVICE_MAINTENANCE_RESOLVED: onDeviceMaintenanceResolved,
      DEVICE_MAINTENANCE_STATUS_LOG_SCHEDULED: async (action, context) =>
        taskTracker(onDeviceMaintenanceStatusLogScheduled, action, context),
      DEVICE_UPDATE_MODULE_SERIALS: onDeviceUpdateModuleSerials,
    },
  },
]

module.exports = { subscriptions }
