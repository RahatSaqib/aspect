module.exports = require('../utils').seed(seed)

const { updateDashboardWidgetQueries } = require('../utils')

async function seed(knex) {
  // TODO: Check if seed file already ran

  await updateDashboardWidgetQueries(knex)
}
