/**
 * Retrieve devices with calibration due date status.
 * @param {*} dueDaysCalibrationIssue - Min dates before calibration due date to create the issue.
 */
async function getCalibrationDueDateStatusFromDevices(knex) {
  /**
   * get last calibration for each deviceId from DeviceMaintenance
   *
   * FYI - we need to use a tricky way to get latest calibration entry
   * because data is stored in DeviceMaintenance not in order and we may have
   * newer updatedOn stored before older entry. And in this case we can't
   * use MAX(dmInner.id) to get id for last calibration.
   */
  const lastCalibrationPerDevice = await knex('DeviceMaintenance as dmInner')
    .join('DeviceMaintenanceType as dmt', 'dmt.id', 'dmInner.deviceMaintenanceTypeId')
    .where('dmt.externalId', 'calibration')
    .groupBy('dmInner.deviceId')
    .select(
      /**
       * get max string as concat of `updatedOn formatted as ISO` and `id`,
       * like `2024-02-08 07:09:27|00002867`
       */
      knex.raw(`
        MAX( 
          CONCAT(
            DATE_FORMAT(dmInner.updatedOn, GET_FORMAT(DATETIME, 'ISO')),
            '|',
            LPAD(dmInner.id, 8, '0')
          )
        ) as date_id
      `),
      'dmInner.deviceId'
    )
  /**
   * now define `DeviceMaintenance.id` for each device - this id is for
   * latest calibration record per device
   */
  lastCalibrationPerDevice.forEach(it => {
    it.id = +it.date_id.split('|')[1]
  })
  const deviceMaintenanceIds = lastCalibrationPerDevice.map(it => it.id)

  return knex(
    knex('Device as d')
      .join('Partner as p', 'p.id', 'd.partnerId')
      .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
      .join('DeviceMaintenance as dm', 'd.id', 'dm.deviceId')
      .whereNotNull(knex.raw("dt.deviceOperationSchema->'$.calibrationValidityInDays'"))
      /**
       * this condition brings 1 entry per device because `deviceMaintenanceIds` contains
       * single `DeviceMaintenance.id` per device (see `groupBy deviceId` in above query)
       */
      .whereIn('dm.id', deviceMaintenanceIds)
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
