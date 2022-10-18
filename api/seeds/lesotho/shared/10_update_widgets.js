const dashboardWidget = require('../../fixtures/DashboardWidgetExtended')
const { upsertDashboardWidgets } = require('../../common')

module.exports = async function (knex, partnerName) {
  const { id: partnerId } = await knex('Partner').where({ name: partnerName }).first('id')

  await upsertDashboardWidgets(knex, partnerId, dashboardWidget)
}
