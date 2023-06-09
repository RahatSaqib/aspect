const { upsertDashboardWidgets } = require('../common')
const { getPartnerByExternalId } = require('../utils')

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await getPartnerByExternalId(knex, 'Nigeria')
  await upsertDashboardWidgets(knex, partnerId, undefined, ['personTitle'])
}, __filename)
