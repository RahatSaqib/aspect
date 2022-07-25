const Promise = require('bluebird')
const _ = require('lodash')
const { getPermissionModules } = require('../utils')
const { upsertJobFunctionPermission } = require('../common')
module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const modules = await getPermissionModules(knex)
  const { id: partnerId } = await knex('Partner')
    .where({
      name: 'Myanmar',
    })
    .first('id')
  const jobFunctions = await knex('JobFunction').where({ partnerId }).select()

  await Promise.each(jobFunctions, async elem => {
    if (_.includes(elem.externalId, 'regionalOfficer') || _.includes(elem.externalId, 'admin'))
      await upsertJobFunctionPermission(knex, elem.id, [
        modules.assay.view,
        modules.dashboard.siteFilter,
        modules.site.view,
      ])
    else await upsertJobFunctionPermission(knex, elem.id, [modules.assay.view])
    await knex('JobFunctionPermission')
      .where({ jobFunctionId: elem.id })
      .whereIn('permissionId', [modules.task.view, modules.task.edit])
      .delete()
  })
}
