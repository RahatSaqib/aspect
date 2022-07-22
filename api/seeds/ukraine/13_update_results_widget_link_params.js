const { upsertDashboardWidgets } = require('../common')
const { getPartnerByName } = require('../utils')
const dashboardWidget = require('../fixtures/DashboardWidgetExtended')

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await getPartnerByName(knex, 'Ukraine')
  await upsertDashboardWidgets(knex, partnerId, dashboardWidget, ['resultsTitle'])
}, __filename)
