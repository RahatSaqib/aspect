const { partnerName } = require('./fixtures/partnerData')
const fixture = require('./fixtures/dashboardWidget')
const { upsertDashboardWidgets } = require('../common')
const { getPartnerByName } = require('../utils')

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await getPartnerByName(knex, partnerName)

  await upsertDashboardWidgets(knex, partnerId, fixture)
}, __filename)
