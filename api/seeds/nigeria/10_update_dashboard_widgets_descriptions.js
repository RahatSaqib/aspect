module.exports = require('../utils').seed(seed, __filename)
const dashboardWidget = require('./fixtures/dashboardWidget.json')
const { upsertDashboardWidgets } = require('../common')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Nigeria' })
    .first()

  await upsertDashboardWidgets(knex, partnerId, dashboardWidget)
}
