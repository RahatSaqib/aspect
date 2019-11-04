module.exports = require('../utils').seed(seed, __filename)

const { upsertJobFunctionPermission, upsertJobFeatures } = require('../common')
const { getPermissionModules } = require('../utils')

async function seed(knex) {
  // give admin access to persons and reporters

  await knex('Permission').insert([
    { module: 'patient', activity: 'admin' },
    { module: 'patient', activity: 'view' },
    { module: 'patient', activity: 'edit' },
  ])

  const [featureid] = await knex('feature').insert({ module: 'patient' })
  const { id: jobFunctionIdAdmin } = await knex('JobFunction')
    .where('name', 'Admin')
    .first('id')

  const modules = await getPermissionModules(knex)
  // features
  await upsertJobFunctionPermission(knex, jobFunctionIdAdmin, [
    modules.patient.admin,
    modules.patient.view,
    modules.patient.edit,
  ])
  await upsertJobFeatures(knex, jobFunctionIdAdmin, [featureid])
}
