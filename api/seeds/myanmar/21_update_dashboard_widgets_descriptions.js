module.exports = require('../utils').seed(seed, __filename)
const Promise = require('bluebird')
const dashboardWidget = require('./fixtures/dashboardWidget.json')

async function seed(knex) {
  const updateDashboardWidgets = [
    ...dashboardWidget.stat,
    ...dashboardWidget.target,
  ].map(({ externalId, description, descriptionI18nKey }) =>
    knex('DashboardWidget').where({ externalId }).update({
      description,
      descriptionI18nKey,
    })
  )

  await Promise.all(updateDashboardWidgets)
}
