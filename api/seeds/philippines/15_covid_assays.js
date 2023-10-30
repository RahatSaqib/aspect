module.exports = require('../utils').seed(seed, __filename)

const { upsertCovidDeviceTypes } = require('../commonCovid')

async function seed(knex) {
  await upsertCovidDeviceTypes(knex)
}
