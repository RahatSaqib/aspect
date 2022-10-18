const _ = require('lodash')
const Promise = require('bluebird')

const { getModuleNameForResult } = require('../../src/plugin/deviceType/gxUtils')

module.exports = async knex => {
  const results = await knex('Result as r')
    .join('Device as d', 'r.deviceId', 'd.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .where('dt.externalId', 'CepheidGeneXpert')
    .whereNull('r.moduleName')
    .groupBy('r.deviceId', 'r.moduleSerial')
    .select('r.deviceId', 'r.moduleSerial')
    .max('r.startedOn as startedOn')

  await Promise.each(results, async result => {
    result.moduleName = await getModuleNameForResult(result.deviceId, result.moduleSerial, result.startedOn, knex)
  })

  await Promise.each(
    _.filter(results, r => r.moduleName),
    async result => {
      await knex('Result')
        .update('moduleName', result.moduleName)
        .where({ deviceId: result.deviceId, moduleSerial: result.moduleSerial })
        .whereNull('moduleName')
    }
  )
}
