const { getPermissionModules } = require('../utils')
const PermissionsDefinition = require('../fixtures/PermissionsDefinition.json')
const { mapJobFunctionPermissions, removePermissions, updatePermissions } = require('../utils')

async function seed(knex) {
  const modules = await getPermissionModules(knex)

  await mapJobFunctionPermissions(knex, [modules.task.view], [modules.task.edit])
  await mapJobFunctionPermissions(knex, [modules.assay.edit], [modules.assay.view])
  await mapJobFunctionPermissions(knex, [modules.account.view], [modules.account.edit])
  
  const permissionsToRemove = [
    modules.assay.edit,
    modules.router.edit,
    modules.account.view,
    modules.issue.view,
    modules.task.view,
    modules.report.edit,
    modules.actionDashboard.edit,
    modules.reporter.edit,
    modules.operationalData.edit,
    modules.account.view
  ]
  await removePermissions(knex, permissionsToRemove)

  await updatePermissions(knex, PermissionsDefinition)
      
}

module.exports = seed