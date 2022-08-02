module.exports = require('../utils').seed(seed, __filename)

const { upsertDashboardWidgets } = require('../common')
const { partnerName } = require('./fixtures/partnerData')
const dashboardWidgets = require('./fixtures/dashboardWidget')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ name: partnerName }).first('id')

  await upsertDashboardWidgets(knex, partnerId, dashboardWidgets)
}
