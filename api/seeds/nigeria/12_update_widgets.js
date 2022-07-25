module.exports = require('../utils').seed(seed, __filename)

const { upsertDashboardWidgets } = require('../common')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ name: 'Nigeria' }).first('id')

  await upsertDashboardWidgets(knex, partnerId)
}
