const dashboardWidget = require('../../fixtures/DashboardWidgetExtended')
const { upsertDashboardWidgets } = require('../../common')
const { getPartnerByExternalId } = require('../../utils')
const { partner } = require('./fixtures/partnerData')

module.exports = require('../../utils').seed(async knex => {
  const { id: partnerId } = await getPartnerByExternalId(knex, partner.externalId)
  await upsertDashboardWidgets(knex, partnerId, dashboardWidget)
}, __filename)
