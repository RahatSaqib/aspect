module.exports = require('../utils').seed(seed)

const { updateDashboardWidgetQueries } = require('../utils')

async function seed(knex) {
  await updateDashboardWidgetQueries(knex)
}
