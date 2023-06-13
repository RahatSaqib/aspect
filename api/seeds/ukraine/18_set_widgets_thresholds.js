const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')
const fixture = require('../fixtures/DashboardWidgetExtended')
const { upsertDashboardWidgets } = require('../common')

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await knex('Partner').where({ externalId: partnerExternalId }).first('id')

  await upsertDashboardWidgets(knex, partnerId, fixture)
}, __filename)
