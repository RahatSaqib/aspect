const { buildBangladeshDeviceName } = require('./bangladeshDeviceName')
const { GENEXPERT_DEVICE_TYPE_EXTERNAL_ID } = require('./geneXpertModuleSuffix')

/**
 * Bangladesh device-name generator: default acronym+id, with a GeneXpert-only
 * module suffix when module capacity or module-type counts are present.
 */
async function generateDeviceName({ knex, deviceId, deviceTypeId }) {
  const deviceType = await knex('DeviceType').where('id', deviceTypeId).first('externalId', 'name', 'acronym')

  if (deviceType?.externalId !== GENEXPERT_DEVICE_TYPE_EXTERNAL_ID) {
    return buildBangladeshDeviceName({ deviceId, deviceType })
  }

  const device = await knex('Device')
    .where('id', deviceId)
    .first('moduleBayCapacity', 'gx6cModulesCount', 'gx10cModulesCount')

  return buildBangladeshDeviceName({
    deviceId,
    deviceType,
    moduleBayCapacity: device?.moduleBayCapacity,
    gx6cModulesCount: device?.gx6cModulesCount,
    gx10cModulesCount: device?.gx10cModulesCount,
  })
}

module.exports = generateDeviceName
