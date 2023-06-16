const dashboardWidget = require('../fixtures/DashboardWidgetExtended')
const { upsertDashboardWidgets } = require('../common')
const { getPartnerByExternalId } = require('../utils')

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await getPartnerByExternalId(knex, 'Ukraine')
  await upsertDashboardWidgets(knex, partnerId, dashboardWidget, ['unusedModules'])
}, __filename)
