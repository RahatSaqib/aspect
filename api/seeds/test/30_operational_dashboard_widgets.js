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
    _.map(widgets, ({ dashboard = 'home', externalId }) =>
      knex('DashboardWidget')
        .where({ externalId })
        .update({
          // assemble CSV string without spaces near commas
          dashboard: dashboard
            .split(',')
            .map(v => v.trim())
            .join(','),
        })
    )
  )
}
