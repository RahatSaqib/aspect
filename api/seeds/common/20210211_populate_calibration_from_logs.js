const Promise = require('bluebird')

const { deviceMaintenanceTypeToId } = require('../../src/shared/dictionary')
const { shouldLogDeviceCalibration } = require('../../src/plugin/utils')

async function seed(knex) {
  const deviceOperations = await knex('DeviceOperation as do')
    // JSON prop type='gx-log' marks entry received from GxConnect as GeneXpert log
    .whereRaw(`IFNULL(do.data ->> '$.type', '') = 'gx-log'`)
    /**
     * JSON array `Calibrations` should contain at least 1 item
     * i.e. checking item at index 0
     */
    .whereRaw(`(do.data ->> '$.details.Calibrations[0]') IS NOT NULL`)
    .select('do.deviceId', 'do.startedOn', 'do.data')
  if (deviceOperations.length > 0) {
    const deviceMaintenanceTypeId = await deviceMaintenanceTypeToId('calibration')

    // process all DeviceOperation entries with specified Calibrations array
    await Promise.all(
      deviceOperations.map(({ deviceId, startedOn, data }) => {
        /**
         * call same func `shouldLogDeviceCalibration` as in endpoint handler
         * `addDeviceDataWithContext` from `api/src/deviceApi/service.js`
         */
        const payload = { startedOn, data: JSON.parse(data) }
        return shouldLogDeviceCalibration(knex, deviceId, payload, deviceMaintenanceTypeId)
      })
    )
  }
}

module.exports = seed
