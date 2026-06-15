const { defaultGenerateDeviceName } = require('../../../device/common/deviceAcronym')
const {
  GENEXPERT_DEVICE_TYPE_EXTERNAL_ID,
  buildGeneXpertModuleSuffix,
} = require('./geneXpertModuleSuffix')

/**
 * Bangladesh device-name generator: default acronym+id, with a GeneXpert-only
 * module suffix when module capacity or module-type counts are present.
 */
async function generateDeviceName({ knex, deviceId, deviceTypeId }) {
  const baseName = await defaultGenerateDeviceName({ knex, deviceId, deviceTypeId })

  const deviceType = await knex('DeviceType').where('id', deviceTypeId).first('externalId')
  if (deviceType?.externalId !== GENEXPERT_DEVICE_TYPE_EXTERNAL_ID) {
    return baseName
  }

  const device = await knex('Device')
    .where('id', deviceId)
    .first('moduleBayCapacity', 'gx6cModulesCount', 'gx10cModulesCount')

  const suffix = buildGeneXpertModuleSuffix(device || {})
  return suffix ? `${baseName} ${suffix}` : baseName
}

module.exports = generateDeviceName
