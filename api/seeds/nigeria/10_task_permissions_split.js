module.exports = require('../utils').seed(seed, __filename)
const { getPermissionModules, mapJobFunctionPermissions } = require('../utils')

async function seed(knex) {
  const modules = await getPermissionModules(knex)

  await mapJobFunctionPermissions(knex, [modules.task.edit, modules.task.view], [modules.taskMenu.view])

  await mapJobFunctionPermissions(knex, [modules.device.edit, modules.site.edit], [modules.task.edit])

  await mapJobFunctionPermissions(knex, [modules.device.view, modules.site.view], [modules.task.view])
}
