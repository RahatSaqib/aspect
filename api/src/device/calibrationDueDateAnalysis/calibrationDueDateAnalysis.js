const { getCalibrationDueDateStatusFromDevices } = require('./db')
const { calibrationDueDateIsClose } = require('../actions')

/**
 * Perform an analysis on all devices to detect the ones close to the calibration due date and raise such event.
 * Threshold days to trigger this is setup in `PartnerData.dueDaysCalibrationIssue`. (e.g. 90 days)
 * Calibration validity is setup in DeviceType.deviceOperationSchema->"$.calibrationValidityInDays"
 * (e.g. 365 days for Cepheid devices)
 */
async function onCalibrationDueDateAnalysis(_, { messageContext }) {
  const context = messageContext.bindActionCreators({
    calibrationDueDateIsClose,
  })

  return context.run(async knex => {
    const devicesCalibrationInfo = await getCalibrationDueDateStatusFromDevices(knex)

    devicesCalibrationInfo.forEach(device => {
      /**
       * trigger an issue when # days left to CalibrationDueDate is less than
       * dueDaysCalibrationIssue (i.e. 90, see in table Partner.dueDaysCalibrationIssue)
       */
      if (isCalibrationOverdue(device)) {
        context.calibrationDueDateIsClose(device.deviceId, device.calibrationDueDate)
      }
    })
  })

  function isCalibrationOverdue(device) {
    return (
      device.daysToCalibrationDueDateIssue < device.dueDaysCalibrationIssue &&
      /**
       * There are many DeviceMaintenance.contextDate = '0001-01-01' - meaning
       * that device wasn't calibrated at all.
       * And number of calibrations older than 2+ years ago.
       * So, we trigger `Due Date Is Close` issue only for devices with
       * due date greater than today.
       */
      device.calibrationDueDate > new Date()
    )
  }
}

module.exports = onCalibrationDueDateAnalysis
