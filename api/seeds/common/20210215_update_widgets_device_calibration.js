const { upsertDashboardWidgets } = require('../common')
const upsertReports = require('./upsert_reports')
const { upsertJobFunctionFixture } = require('../common')
const { getPartnerByName } = require('../utils')

module.exports = async (knex, dashboardWidgetFixture, partnerName, jobFunctionFixture) => {
  const { id: partnerId } = await getPartnerByName(knex, partnerName)

  await upsertReports(knex)
  await upsertJobFunctionFixture(knex, jobFunctionFixture, partnerId)

  await upsertDashboardWidgets(knex, partnerId, dashboardWidgetFixture, [
    'deviceCalibrationPastDue',
    'deviceCalibratedWhenDue',
  ])
}
