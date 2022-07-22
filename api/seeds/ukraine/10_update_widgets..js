module.exports = require('../utils').seed(seed, __filename)

const { upsertDashboardWidgets } = require('../common')
const dashboardWidget = require('../fixtures/DashboardWidgetExtended')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ name: 'Ukraine' }).first('id')

  await upsertDashboardWidgets(knex, partnerId, dashboardWidget)
}
