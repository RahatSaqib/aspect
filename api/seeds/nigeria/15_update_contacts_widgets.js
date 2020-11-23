const { upsertDashboardWidgets } = require('../common')
const { getPartnerByName } = require('../utils')

module.exports = require('../utils').seed(
  async (knex) => {
    const { id: partnerId } = await getPartnerByName(knex, 'Nigeria')
    await upsertDashboardWidgets(knex, partnerId, undefined, ['personTitle'])
  }, __filename)
