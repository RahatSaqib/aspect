const dashboardWidget = require('../fixtures/DashboardWidget')
const { upsertDashboardWidgets } = require('../common')
const { getPartnerByName } = require('../utils')

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await getPartnerByName(knex, 'Ethiopia EPHI')
  await upsertDashboardWidgets(knex, partnerId, dashboardWidget, ['resultsTitle'])
}, __filename)
