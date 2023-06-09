const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')
const fixture = require('../fixtures/DashboardWidgetExtended')
const { upsertDashboardWidgets } = require('../common')
const { getPartnerByExternalId } = require('../utils')

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerExternalId)

  await upsertDashboardWidgets(knex, partnerId, fixture)
}, __filename)
