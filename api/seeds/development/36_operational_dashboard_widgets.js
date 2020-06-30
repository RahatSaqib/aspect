module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const dashboardWidget = require('./fixtures/dashboardWidget.json')
const dashboardWidgetMyanmar = require('./fixtures/myanmarDashboardWidget.json')

async function seed(knex) {
  const widgets = [
    ...dashboardWidget.stat,
    ...dashboardWidgetMyanmar.stat,
    ...dashboardWidgetMyanmar.target,
  ]
  await Promise.all(
    _.map(widgets, ({ dashboards = ['home'], externalId }) =>
      knex('DashboardWidget')
        .where({ externalId })
        .update({
          dashboardsJson: JSON.stringify(dashboards),
        })
    )
  )
}
