module.exports = require('../utils').seed(seed, __filename)
const { getPermissionModules, mapJobFunctionPermissions } = require('../utils')

async function seed(knex) {
  const modules = await getPermissionModules(knex)
  const modulesNames = Object.keys(modules).filter(
    name => modules[name].admin && !modules[name].edit
  )

  const insertEditPermissions = modulesNames.map(async moduleName => {
    const [permissionId] = await knex('Permission').insert({
      module: moduleName,
      activity: 'edit',
    })
    modules[moduleName].edit = permissionId
  })
  await Promise.all(insertEditPermissions)

  const insertJobFunctionEditPermissions = modulesNames.map(moduleName =>
    mapJobFunctionPermissions(
      knex,
      [modules[moduleName].admin],
      [modules[moduleName].edit]
    )
  )
  await Promise.all(insertJobFunctionEditPermissions)

  await knex('Permission').where({ activity: 'admin' }).delete()
}
