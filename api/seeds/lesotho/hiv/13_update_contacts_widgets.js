const dashboardWidget = require('../../fixtures/DashboardWidgetExtended')
const { upsertDashboardWidgets } = require('../../common')
const { getPartnerByName } = require('../../utils')

module.exports = require('../../utils').seed(async knex => {
  const { id: partnerId } = await getPartnerByName(knex, 'Lesotho HIV')
  await upsertDashboardWidgets(knex, partnerId, dashboardWidget, ['personTitle'])
}, __filename)
