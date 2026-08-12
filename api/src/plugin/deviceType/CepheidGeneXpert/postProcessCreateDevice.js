/**
 * Device has been created, called after a new device record is inserted.
 * For CepheidGeneXpert devices, this creates an Instrument record if not exists.
 *
 * @param {Object} context - The context object with device, payload, knex, now, etc.
 */
async function postProcessCreateDevice(context) {
  const { device, knex, now, userId, instrumentSerial, instrumentMacAddress } = context

  // Check if instrument already exists for this device
  const existingInstrument = await knex('Instrument')
    .where({
      deviceId: device.id,
      serial: instrumentSerial,
    })
    .first()

  if (existingInstrument) {
    return
  }

  // Insert new instrument record
  await knex('Instrument').insert({
    deviceId: device.id,
    serial: instrumentSerial,
    macAddress: instrumentMacAddress || null,
    active: true,
    createdOn: now,
    createdBy: userId || null,
    updatedOn: now,
    updatedBy: userId || null,
  })
}

module.exports = postProcessCreateDevice
