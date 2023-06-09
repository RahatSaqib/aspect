const { upsertDashboardWidgets } = require('../common')
const { getPartnerByExternalId } = require('../utils')

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await getPartnerByExternalId(knex, 'Zimbabwe')
  await upsertDashboardWidgets(knex, partnerId, undefined, ['resultsTitle'])
}, __filename)
