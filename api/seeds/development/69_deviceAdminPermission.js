module.exports = require('../utils').seed(async knex => {
  const { id: adminPermissionId } = await knex('Permission').where({ module: 'device', activity: 'admin' }).first('id')

  const { id: adminJobFunctionId } = await knex('JobFunction').where({ externalId: 'admin' }).first('id')

  await knex('JobFunctionPermission').insert({
    jobFunctionId: adminJobFunctionId,
    permissionId: adminPermissionId,
  })
}, __filename)
