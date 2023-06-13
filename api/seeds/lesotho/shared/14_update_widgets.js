const dashboardWidget = require('../../fixtures/DashboardWidgetExtended')
const { upsertDashboardWidgets } = require('../../common')

module.exports = async function seed(knex, partnerExternalId) {
  const { id: partnerId } = await knex('Partner').where({ externalId: partnerExternalId }).first('id')

  await upsertDashboardWidgets(knex, partnerId, dashboardWidget, [
    'gxPositiveResultsNotified',
    'averageRecipientsOfEmail',
    'averageRecipientsOfSms',
  ])
}
