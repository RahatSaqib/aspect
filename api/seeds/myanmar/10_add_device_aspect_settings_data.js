module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  return knex('DeviceAspectSettings').insert([
    {
      deviceId: 2,
      enableCustomFieldParsing: false,
    },
  ])
}
