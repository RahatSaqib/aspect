module.exports = require('../utils').seed(seed, __filename)

const { upsertJobFunctionPermission } = require('../common')
const { getPermissionModules } = require('../utils')

async function seed(knex) {
  // give admin access to persons and reporters

  await knex('Permission').insert([
    { module: 'patient', activity: 'view' },
    { module: 'patient', activity: 'edit' },
  ])

  const { id: jobFunctionIdSuperAdmin } = await knex('JobFunction').where('name', 'Super Admin').first('id')

  const modules = await getPermissionModules(knex)
  await upsertJobFunctionPermission(knex, jobFunctionIdSuperAdmin, [modules.patient.view, modules.patient.edit])
}
