const { upsertDashboardWidgets } = require('../common')
const upsertReports = require('./upsert_reports')
const { upsertJobFunctionFixture } = require('../common')
const { getPartnerByExternalId } = require('../utils')

module.exports = async (knex, dashboardWidgetFixture, partnerExternalId, jobFunctionFixture) => {
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerExternalId)

  await upsertReports(knex)
  await upsertJobFunctionFixture(knex, jobFunctionFixture, partnerId)

  await upsertDashboardWidgets(knex, partnerId, dashboardWidgetFixture, [
    'deviceCalibrationPastDue',
    'deviceCalibratedWhenDue',
  ])
}
