/**
 * Retrieve devices with calibration due date status.
 * @param {*} dueDaysCalibrationIssue - Min dates before calibration due date to create the issue.
 */
async function getCalibrationDueDateStatusFromDevices(knex) {
  /**
   * sub-query to get last DeviceMaintenance for each deviceId
   */
  const lastCalibrationPerDevice = knex('DeviceMaintenance as dmInner')
    .join('DeviceMaintenanceType as dmt', 'dmt.id', 'dmInner.deviceMaintenanceTypeId')
    .where('dmt.externalId', 'calibration')
    .groupBy('dmInner.deviceId')
    .select(knex.raw('MAX(dmInner.id) as id'), 'dmInner.deviceId')

  return knex(
    knex('Device as d')
      .join('Partner as p', 'p.id', 'd.partnerId')
      .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
      .join(lastCalibrationPerDevice.as('dm2'), 'd.id', 'dm2.deviceId')
      .join('DeviceMaintenance as dm', 'dm2.id', 'dm.id')
      .whereNotNull(knex.raw("dt.deviceOperationSchema->'$.calibrationValidityInDays'"))
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
    daysToCalibrationDueDateIssue: knex.raw(`
      DATEDIFF(
        ADDDATE(calibratedOn, calibrationValidityInDays),
        now()
      )
    `),
    dueDaysCalibrationIssue: 'dueDaysCalibrationIssue',
  })
}

module.exports = { getCalibrationDueDateStatusFromDevices }
