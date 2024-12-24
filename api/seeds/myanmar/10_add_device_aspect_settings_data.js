module.exports = require('../utils').seed(async function (knex) {
  const deviceId = 3052
  const deviceExists = await knex('Devices').where('id', deviceId).first()

  if (!deviceExists) {
    return
  }

  return knex('DeviceAspectSettings')
    .insert([
      {
        deviceId,
        enableCustomFieldParsing: false,
      },
    ])
    .onConflict('deviceId')
    .merge()
})
