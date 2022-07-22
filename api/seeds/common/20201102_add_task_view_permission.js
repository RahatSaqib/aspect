const { getPermissionModules } = require('../utils')
const { mapJobFunctionPermissions } = require('../utils')

async function seed(knex) {
  const modules = await getPermissionModules(knex)

  await Promise.all([mapJobFunctionPermissions(knex, [modules.taskMenu.view], [modules.task.view])])
}

module.exports = seed
