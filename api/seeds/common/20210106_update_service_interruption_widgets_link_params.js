const { upsertDashboardWidgets } = require('../common')
const { getPartnerByExternalId } = require('../utils')

module.exports = async (knex, dashboardWidgetFixture, partnerExternalId) => {
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerExternalId)
  await upsertDashboardWidgets(knex, partnerId, dashboardWidgetFixture, [
    'numberOfDevicesExperiencingServiceInterruption',
    'averageDurationServiceInterruption',
    'percentageOfDaysWithServiceInterruption',
  ])
}
