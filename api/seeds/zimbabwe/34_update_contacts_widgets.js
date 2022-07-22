const { upsertDashboardWidgets } = require('../common')
const { getPartnerByName } = require('../utils')
const dashboardWidget = require('./fixtures/dashboardWidget')

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await getPartnerByName(knex, 'Zimbabwe')
  await upsertDashboardWidgets(knex, partnerId, dashboardWidget, ['personTitle'])
}, __filename)
