/**
 * Retrieve devices with calibration due date status.
 * @param {*} dueDaysCalibrationIssue - Min dates before calibration due date to create the issue.
 */
async function getCalibrationDueDateStatusFromDevices(knex) {
  return knex(
    knex('Device as d')
      .join('Partner as p', 'p.id', 'd.partnerId')
      .join('DeviceMaintenance as dm', 'd.id', 'dm.deviceId')
      .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
      .whereNotNull(knex.raw("dt.deviceOperationSchema->'$.calibrationValidityInDays'"))
      .whereIn(
        'dm.id',
        knex('DeviceMaintenance as dm2')
          .join('DeviceMaintenanceType as dmt', 'dmt.id', 'dm2.deviceMaintenanceTypeId')
          .where('dmt.externalId', 'calibration')
          .max('dm2.id')
      )
      .select({
        deviceId: 'd.id',
        calibratedOn: 'dm.contextDate',
        calibrationValidityInDays: knex.raw("dt.deviceOperationSchema->'$.calibrationValidityInDays'"),
        dueDaysCalibrationIssue: 'p.dueDaysCalibrationIssue',
      })
      .as('t')
  ).select({
    deviceId: 'deviceId',
    calibrationDueDate: knex.raw('ADDDATE(calibratedOn, calibrationValidityInDays)'),
    daysToCalibrationDueDateIssue: knex.raw(
      `DATEDIFF(calibratedOn, now()) + calibrationValidityInDays - dueDaysCalibrationIssue`
    ),
    dueDaysCalibrationIssue: 'dueDaysCalibrationIssue',
  })
}

module.exports = { getCalibrationDueDateStatusFromDevices }
