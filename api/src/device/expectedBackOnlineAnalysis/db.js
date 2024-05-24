const _ = require('lodash')
/**
 * Retrieve devices with overdue being offline
 */
async function getOverdueDevices(knex) {
  /**
   * get all devices with current maintenance status non-active and
   * defined `options.data.expectedBackOnline` (which is being saved when
   * user manually changes status on Device Details page)
   */
  const devicesManuallyChanged = await knex('Device as d')
    .join('Partner as p', 'p.id', 'd.partnerId')
    .join('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.id')
    .join('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
    .where('dms.active', 0)
    .whereRaw("dmsl.data ->>'$.options.data.expectedBackOnline' is not null")
    .select({
      deviceId: 'd.id',
      maintenanceDueOn: knex.raw("dmsl.data ->>'$.options.data.expectedBackOnline'"),
    })

  /**
   * get all devices with flag `offline` set to 1 in FactDeviceFlag table,
   * this is happening automatically via different MQ issues and scheduler jobs
   */
  const devicesAutomaticallyChanged = await knex('Device as d')
    .join('Partner as p', 'p.id', 'd.partnerId')
    .join('FactDeviceFlag as fdf', 'd.id', 'fdf.deviceId')
    .where('fdf.offline', 1)
    .whereNotNull('fdf.maintenanceDueOn')
    .select({
      deviceId: 'd.id',
      maintenanceDueOn: 'fdf.maintenanceDueOn',
    })

  /**
   * get object with { [deviceId]: [maintenanceDueOn] } values
   */
  const manuallyChanged = _.reduce(
    devicesManuallyChanged,
    (acc, it) => {
      acc[it.deviceId] = new Date(it.maintenanceDueOn)
      return acc
    },
    {}
  )
  /**
   * make sure final json object contains all data from manually or auto changed
   * maintenance statuses
   */
  let items = _.reduce(
    devicesAutomaticallyChanged,
    (acc, it) => {
      /**
       * manually changed device maintenance status takes precedence over
       * automatically changed one
       */
      if (!acc[it.deviceId]) {
        acc[it.deviceId] = new Date(it.maintenanceDueOn)
      }
      return acc
    },
    manuallyChanged
  )

  /**
   * get final array with { deviceId, maintenanceDueOn } items
   */
  items = _.reduce(
    _.keys(items),
    (acc, deviceId) => {
      acc = [...acc, { deviceId, maintenanceDueOn: items[deviceId] }]
      return acc
    },
    []
  )
  return items
}

module.exports = { getOverdueDevices }
