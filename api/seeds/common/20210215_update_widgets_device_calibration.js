const { upsertDashboardWidgets } = require('../common')
const updateReportsAndJobFunctions = require('./upsert_reports_&_job_functions')
const { getPartnerByName } = require('../utils')

module.exports = async (
  knex,
  dashboardWidgetFixture,
  partnerName,
  jobFunctionFixture
) => {
  const { id: partnerId } = await getPartnerByName(knex, partnerName)
  await updateReportsAndJobFunctions(knex, jobFunctionFixture, partnerName)
  await upsertDashboardWidgets(knex, partnerId, dashboardWidgetFixture, [
    'deviceCalibrationPastDue',
  ])
}
