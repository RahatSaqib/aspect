const { upsertDashboardWidgets } = require('../common')
const { getPartnerByName } = require('../utils')

module.exports = async (knex, dashboardWidgetFixture, partnerName) => {
  const { id: partnerId } = await getPartnerByName(knex, partnerName)
  await upsertDashboardWidgets(knex, partnerId, dashboardWidgetFixture, [
    'numberOfDevicesExperiencingServiceInterruption',
    'averageDurationServiceInterruption',
    'percentageOfDaysWithServiceInterruption',
  ])
}
