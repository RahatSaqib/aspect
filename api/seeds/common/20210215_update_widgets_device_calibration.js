const { upsertDashboardWidgets } = require('../common')
const upsertReports = require('./upsert_reports')
const { getPartnerByName } = require('../utils')

module.exports = async (knex, dashboardWidgetFixture, partnerName) => {
  const { id: partnerId } = await getPartnerByName(knex, partnerName)
  await upsertReports(knex)
  await upsertDashboardWidgets(knex, partnerId, dashboardWidgetFixture, [
    'deviceCalibrationPastDue',
  ])
}
