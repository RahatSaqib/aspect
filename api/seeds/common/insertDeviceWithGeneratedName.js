/**
 * ASP-7977 Device Name Redesign.
 *
 * Seed-layer helper that inserts a Device row and immediately sets
 * `name` / `shortName` to the auto-generated value `${acronym}${id}`.
 *
 * The name must be set AFTER insert because it depends on the
 * auto-increment Device.id. Uses the same acronym resolution logic as
 * the production plugin (`src/device/common/deviceAcronym.js`).
 *
 * Usage:
 *   const { insertDeviceWithGeneratedName } = require('../common/insertDeviceWithGeneratedName')
 *   const { id, name } = await insertDeviceWithGeneratedName(knex, { partnerId, deviceTypeId, ... })
 *   // Do NOT pass `name` or `shortName` — they are generated here.
 *
 * @param {import('knex').Knex} knex
 * @param {Object} deviceData - Device row fields (must include `deviceTypeId`; omit `name`/`shortName`)
 * @returns {Promise<{ id: number, name: string, shortName: string }>}
 */
const { acronymForDeviceType } = require('../../src/device/common/deviceAcronym')

async function insertDeviceWithGeneratedName(knex, deviceData) {
  // Insert with a temporary placeholder so the NOT NULL constraint is satisfied.
  const [deviceId] = await knex('Device').insert({ ...deviceData, name: 'device', shortName: 'device' })

  const deviceType = await knex('DeviceType')
    .where('id', deviceData.deviceTypeId)
    .first('externalId', 'name', 'acronym')

  const name = `${acronymForDeviceType(deviceType || {})}${deviceId}`
  const shortName = name.substr(0, 45)

  await knex('Device').where('id', deviceId).update({ name, shortName })

  return { id: deviceId, name, shortName }
}

module.exports = { insertDeviceWithGeneratedName }
