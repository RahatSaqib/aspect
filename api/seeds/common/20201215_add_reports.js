module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')
const { upsertJobFunctionPermission } = require('../common')
const { getPermissionModules } = require('../utils')
const { addReports } = require('../utils')

async function seed(knex) {
  const jobFunctions = await knex('JobFunction').select('id').pluck('id')

  const modules = await getPermissionModules(knex)
  await Promise.each(jobFunctions, jobFunctionId =>
    upsertJobFunctionPermission(knex, jobFunctionId, [modules.report.view])
  )
  await addReports(knex)
}
module.exports = seed
