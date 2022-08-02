module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const dashboardWidget = require('./fixtures/dashboardWidget')
const { upsertDashboardWidgets } = require('../common')

async function seed(knex) {
  const partnerOneName = 'Partner One'
  const { id: partnerId } = await knex('Partner').where({ name: partnerOneName }).first('id')

  dashboardWidget.stat = _.filter(dashboardWidget.stat, d => !d.partnerNames || d.partnerNames.includes(partnerOneName))

  await upsertDashboardWidgets(knex, partnerId, dashboardWidget)
}
