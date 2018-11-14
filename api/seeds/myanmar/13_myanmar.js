module.exports = require('../utils').seed(seed)

const { updateDashboardWidgetQueries } = require('../utils_myanmar')

async function seed(knex) {
  await updateDashboardWidgetQueries(knex)
}
