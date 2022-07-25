module.exports = require('../utils').seed(seed, __filename)

const dashboardWidget = require('../../fixtures/DashboardWidgetExtended')
const { upsertDashboardWidgets } = require('../common')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ name: 'Lesotho' }).first('id')

  await upsertDashboardWidgets(knex, partnerId, dashboardWidget)
}
