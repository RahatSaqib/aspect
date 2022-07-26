module.exports = require('../utils').seed(seed, __filename)

const dashboardWidget = require('./fixtures/dashboardWidget')
const { upsertDashboardWidgets } = require('../common')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ name: 'Zimbabwe' }).first('id')

  await upsertDashboardWidgets(knex, partnerId, dashboardWidget)
}
