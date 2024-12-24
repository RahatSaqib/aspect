module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const deviceId = 3052
  const deviceExists = await knex('Device').where('id', deviceId).first()

  if (!deviceExists) {
    return
  }
  return knex('DeviceAspectSettings').insert([
    {
      deviceId,
      enableCustomFieldParsing: false,
    },
  ])
}
