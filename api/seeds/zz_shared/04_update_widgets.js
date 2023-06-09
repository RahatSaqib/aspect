/* eslint-disable import/no-dynamic-require */
module.exports = require('../utils').seed(seed, `${__filename}-${new Date().toISOString()}`)

const { upsertDashboardWidgets } = require('../common')

const dashboardWidgets = require(`../${process.env['seeds.directory'].replace(
  './seeds/',
  ''
)}/fixtures/dashboardWidget`)
const { partner } = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)
async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ externalId: partner.externalId }).first('id')

  await upsertDashboardWidgets(knex, partnerId, dashboardWidgets)
}
