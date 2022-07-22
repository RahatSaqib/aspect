module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')
const dashboardWidget = require('./fixtures/dashboardWidget')
const { getPermissionModules } = require('../utils')
const { upsertDashboardWidgets, upsertJobFunctionPermission } = require('../common')

async function seed(knex) {
  // give admin, regionalOfficer, and labUser access to summary dashboard
  const modules = await getPermissionModules(knex)

  const jobFunctions = await knex('JobFunction')
    .whereIn('externalId', ['admin', 'regionalOfficer', 'labUser'])
    .select('id')

  await Promise.each(jobFunctions, async jobFunction => {
    await upsertJobFunctionPermission(knex, jobFunction.id, [modules.dashboard.summary])
  })

  // set up widgets for users
  const { id: partnerId } = await knex('Partner').where({ name: 'Zimbabwe' }).first('id')

  await upsertDashboardWidgets(knex, partnerId, dashboardWidget)
}
