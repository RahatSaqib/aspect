module.exports = require('../utils').seed(seed, __filename)

const dashboardWidgets = require('./fixtures/dashboardWidget')
const { upsertDashboardWidgets } = require('../common')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ name: 'Myanmar' }).first('id')

  await upsertDashboardWidgets(knex, partnerId, dashboardWidgets)
}
