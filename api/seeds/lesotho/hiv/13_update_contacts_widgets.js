const dashboardWidget = require('../../fixtures/DashboardWidgetExtended')
const upsertContactsWidget = require('../../common/20201123_upsert_contacts_widget')

module.exports = require('../../utils').seed(
  async (knex) => {
    await upsertContactsWidget(knex, 'Lesotho TB', dashboardWidget)
  }, __filename)
