const { upsertDashboardWidgets } = require('../common')
const { getPartnerByExternalId } = require('../utils')
const dashboardWidget = require('./fixtures/dashboardWidget')

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await getPartnerByExternalId(knex, 'Philippines')
  await upsertDashboardWidgets(knex, partnerId, dashboardWidget, ['resultsTitle'])
}, __filename)
