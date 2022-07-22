const dashboardWidget = require('./fixtures/dashboardWidget')
const { upsertDashboardWidgets } = require('../common')
const { getPartnerByName } = require('../utils')

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await getPartnerByName(knex, 'Pakistan')
  await upsertDashboardWidgets(knex, partnerId, dashboardWidget, ['unusedModules'])
}, __filename)
