const { partnerName } = require('./fixtures/partnerData')
const fixture = require('../../fixtures/DashboardWidgetExtended')
const { upsertDashboardWidgets } = require('../../common')

module.exports = require('../../utils').seed(async knex => {
  const { id: partnerId } = await knex('Partner').where({ name: partnerName }).first('id')

  await upsertDashboardWidgets(knex, partnerId, fixture)
}, __filename)
