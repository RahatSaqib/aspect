const { getPartnerByName } = require('../utils')
const { upsertDashboardWidgets } = require('../common')

module.exports = async (knex, partnerName, fixture) => {
  const { id: partnerId } = await getPartnerByName(knex, partnerName)
  await upsertDashboardWidgets(knex, partnerId, fixture, ['averageDaysModuleSwap', 'instrumentsReplaced'])
}
