const { upsertDashboardWidgets } = require('../../common')

module.exports = async function (knex, partnerExternalId) {
  const { id: partnerId } = await knex('Partner').where({ externalId: partnerExternalId }).first('id')

  await upsertDashboardWidgets(knex, partnerId)
}
