module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const dashboardWidget = require('./fixtures/dashboardWidget')
const { upsertDashboardWidgets } = require('../common')

async function seed(knex) {
  const partnerOneExternalId = 'partnerone'
  const { id: partnerId } = await knex('Partner').where({ externalId: partnerOneExternalId }).first('id')

  dashboardWidget.stat = _.filter(
    dashboardWidget.stat,
    d => !d.partnerExternalIds || d.partnerExternalIds.includes(partnerOneExternalId)
  )

  await upsertDashboardWidgets(knex, partnerId, dashboardWidget)
}
