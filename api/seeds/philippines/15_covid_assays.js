module.exports = require('../utils').seed(seed, __filename)

const { upsertCovidDeviceTypes } = require('../commonCovid')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where('name', 'Philippines').first('id')
  await upsertCovidDeviceTypes(knex, partnerId)
}
