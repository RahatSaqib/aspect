const { buildBangladeshDeviceName } = require('./bangladeshDeviceName')

/**
 * Computes the device name from the edited device payload.
 * Device type is supplied by the caller so no DB lookup is required.
 *
 * @param {Object} context - { deviceId, deviceType, editedDevice }
 * @returns {Promise<string>}
 */
async function resolveDeviceNameOnEdit({ deviceId, deviceType, editedDevice }) {
  return buildBangladeshDeviceName({
    deviceId,
    deviceType,
    customNamePart: editedDevice.customNamePart,
    moduleBayCapacity: editedDevice.moduleBayCapacity,
    gx6cModulesCount: editedDevice.gx6cModulesCount,
    gx10cModulesCount: editedDevice.gx10cModulesCount,
  })
}

module.exports = resolveDeviceNameOnEdit
