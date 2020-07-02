module.exports = require('../utils').seed(seed, __filename)

const dashboardWidget = require('./fixtures/dashboardWidget.json')
const dashboardWidgetMyanmar = require('./fixtures/myanmarDashboardWidget.json')
const { seedDashboardsJsonInDashboardWidget } = require('../utils')

async function seed(knex) {
  await seedDashboardsJsonInDashboardWidget(knex, [
    ...dashboardWidget.stat,
    ...dashboardWidgetMyanmar.stat,
    ...dashboardWidgetMyanmar.target,
  ])
}
