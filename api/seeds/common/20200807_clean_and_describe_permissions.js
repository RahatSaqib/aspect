const { getPermissionModules } = require('../utils')
const PermissionsDefinition = require('../fixtures/PermissionsDefinition.json')
const { mapJobFunctionPermissions, removePermissions, updatePermissions } = require('../utils')

async function seed(knex) {
  const modules = await getPermissionModules(knex)

  await Promise.all([
    mapJobFunctionPermissions(knex, [modules.assay.edit], [modules.assay.view]),
    mapJobFunctionPermissions(knex, [modules.router.edit], [modules.router.view]),
    mapJobFunctionPermissions(knex, [modules.account.view], [modules.account.edit]),
    mapJobFunctionPermissions(knex, [modules.issue.edit], [modules.issue.view]),
    mapJobFunctionPermissions(knex, [modules.report.edit], [modules.report.view]),
    mapJobFunctionPermissions(knex, [modules.actionDashboard.edit], [modules.dashboard.action]),
    mapJobFunctionPermissions(knex, [modules.operationalData.edit], [modules.operationalData.view]),
  ])

  const permissionsToRemove = [
    modules.assay.edit,
    modules.router.edit,
    modules.account.view,
    modules.issue.view,
    modules.task.edit,
    modules.report.edit,
    modules.actionDashboard.edit,
    modules.operationalData.edit,
  ]
  await removePermissions(knex, permissionsToRemove)

  await updatePermissions(knex, PermissionsDefinition)
}

module.exports = seed
