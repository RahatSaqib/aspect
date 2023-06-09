const dashboardWidget = require('./fixtures/dashboardWidget')
const { upsertDashboardWidgets } = require('../common')
const { getPartnerByExternalId } = require('../utils')

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await getPartnerByExternalId(knex, 'Zimbabwe')
  await upsertDashboardWidgets(knex, partnerId, dashboardWidget, ['unusedModules'])
}, __filename)
