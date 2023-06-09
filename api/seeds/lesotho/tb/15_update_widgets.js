module.exports = require('../../utils').seed(seed, __filename)

const dashboardWidget = require('../../fixtures/DashboardWidgetExtended')
const { upsertDashboardWidgets } = require('../../common')
const { partner } = require('./fixtures/partnerData')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ externalId: partner.externalId }).first('id')

  await upsertDashboardWidgets(knex, partnerId, dashboardWidget)
}
