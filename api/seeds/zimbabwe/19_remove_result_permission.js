module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  // cepheid, and technician shouldn't have access to result:view
  const { id: resultViewPermissionId } = await knex('Permission')
    .where('module', 'result')
    .andWhere('activity', 'view')
    .first('id')

  const jobFunctionIds = await knex('JobFunction')
    .where('externalId', 'deviceMaker')
    .orWhere('externalId', 'technician')
    .pluck('id')

  await knex('JobFunctionPermission')
    .whereIn('jobFunctionId', jobFunctionIds)
    .andWhere('permissionId', resultViewPermissionId)
    .del()
}
