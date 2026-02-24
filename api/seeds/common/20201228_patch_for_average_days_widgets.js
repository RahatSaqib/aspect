const { getPartnerByExternalId } = require('../utils')
const { upsertDashboardWidgets } = require('../common')

module.exports = async (knex, partnerExternalId, fixture) => {
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerExternalId)
  await upsertDashboardWidgets(knex, partnerId, fixture, ['averageDaysModuleSwap'])
}
