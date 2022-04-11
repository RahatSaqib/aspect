/* eslint-disable import/no-dynamic-require */
module.exports = require('../utils').seed(seed, __filename)

const { upsertDashboardWidgets } = require('../common')

const dashboardWidgets = require(`../${process.env['seeds.directory'].replace(
  './seeds/',
  ''
)}/fixtures/dashboardWidget`)
const { partnerName } = require(`../${process.env['seeds.directory'].replace(
  './seeds/',
  ''
)}/fixtures/partnerData`)
async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: partnerName })
    .first('id')

  await upsertDashboardWidgets(knex, partnerId, dashboardWidgets)
}
