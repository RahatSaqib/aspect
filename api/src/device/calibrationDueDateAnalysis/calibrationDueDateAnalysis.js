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
      if (isCalibrationOverdue(device)) {
        context.calibrationDueDateIsClose(device.deviceId, device.calibrationDueDate, device.dueDaysCalibrationIssue)
      }
    })
  })

  function isCalibrationOverdue(device) {
    return (
      device.daysToCalibrationDueDateIssue < device.dueDaysCalibrationIssue && device.calibrationDueDate > new Date()
    )
  }
}

module.exports = onCalibrationDueDateAnalysis
