/**
 * ASP-7977 Device Name Redesign.
 *
 * Shared helper that all device-creation paths use to assign the generated
 * device name after the row is inserted (the name depends on the
 * auto-increment Device.id). Name generation is delegated to the
 * `generateDeviceName` plugin action so partners/device types can override it;
 * the base plugin produces `${DeviceType.acronym}${Device.id}`.
 */
const { loadPlugin } = require('../../plugin/loadPlugin')

/**
 * Generates and persists Device.name (and the 45-char Device.shortName) for an
 * already-inserted device.
 *
 * @param {Object} knex - knex instance or transaction
 * @param {Object} params - { deviceId, deviceTypeId, partnerPluginName, deviceTypePluginName }
 * @returns {Promise<{ name: string, shortName: string }>}
 */
async function assignGeneratedDeviceName(knex, { deviceId, deviceTypeId, partnerPluginName, deviceTypePluginName }) {
  const generateDeviceName = await loadPlugin(partnerPluginName, deviceTypePluginName, 'generateDeviceName')
  const name = await generateDeviceName({ knex, deviceId, deviceTypeId })
  const shortName = String(name || '').substr(0, 45)

  await knex('Device').where('id', deviceId).update({ name, shortName })

  return { name, shortName }
}

/**
 * Delegates device-name resolution on edit to the partner/device-type plugin.
 * Returns null when the plugin has no override (caller should use payload name).
 *
 * @param {Object} params - { partnerPluginName, deviceTypePluginName, deviceId, currentName, deviceType, editedDevice }
 * @returns {Promise<string|null>}
 */
async function resolveDeviceNameOnEdit({
  partnerPluginName,
  deviceTypePluginName,
  deviceId,
  currentName,
  deviceType,
  editedDevice,
}) {
  const resolveAction = await loadPlugin(partnerPluginName, deviceTypePluginName, 'resolveDeviceNameOnEdit')
  return resolveAction({ deviceId, currentName, deviceType, editedDevice })
}

module.exports = {
  assignGeneratedDeviceName,
  resolveDeviceNameOnEdit,
}
