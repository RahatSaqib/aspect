module.exports = require('../utils').seed(seed, __filename)
const { getPermissionModules, mapJobFunctionPermissions } = require('../utils')

async function seed(knex) {
  const modules = await getPermissionModules(knex)

  await mapJobFunctionPermissions(
    knex,
    [modules.task.admin, modules.task.edit, modules.task.view],
    [modules.taskMenu.view]
  )

  await mapJobFunctionPermissions(
    knex,
    [
      modules.device.admin,
      modules.device.edit,
      modules.device.view,
      modules.site.admin,
      modules.site.edit,
      modules.site.view,
    ],
    [modules.task.admin, modules.task.edit, modules.task.view]
  )
}
