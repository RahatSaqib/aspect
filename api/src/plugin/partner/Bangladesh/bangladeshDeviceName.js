const { acronymForDeviceType, withCustomNamePart } = require('../../../device/common/deviceAcronym')
const { GENEXPERT_DEVICE_TYPE_EXTERNAL_ID, buildGeneXpertModuleSuffix } = require('./geneXpertModuleSuffix')

function buildBangladeshDeviceName({
  deviceId,
  deviceType,
  customNamePart,
  moduleBayCapacity,
  gx6cModulesCount,
  gx10cModulesCount,
}) {
  const baseName = withCustomNamePart(`${acronymForDeviceType(deviceType || {})}${deviceId}`, customNamePart)

  if (deviceType?.externalId !== GENEXPERT_DEVICE_TYPE_EXTERNAL_ID) {
    return baseName
  }

  const suffix = buildGeneXpertModuleSuffix({ moduleBayCapacity, gx6cModulesCount, gx10cModulesCount })
  return suffix ? `${baseName} ${suffix}` : baseName
}

module.exports = {
  buildBangladeshDeviceName,
}
