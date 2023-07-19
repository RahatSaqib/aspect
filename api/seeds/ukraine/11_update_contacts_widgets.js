const { upsertDashboardWidgets } = require('../common')
const { getPartnerByExternalId } = require('../utils')
const dashboardWidget = require('../fixtures/DashboardWidgetExtended')

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await getPartnerByExternalId(knex, 'Ukraine')
  await upsertDashboardWidgets(knex, partnerId, dashboardWidget)
}, __filename)
