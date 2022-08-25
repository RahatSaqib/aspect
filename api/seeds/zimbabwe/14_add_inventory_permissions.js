module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')
const { getPermissionModules } = require('../utils')
const { upsertJobFunctionPermission } = require('../common')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ name: 'Zimbabwe' }).first('id')

  const modules = await getPermissionModules(knex)
  const jobFunctions = await knex('JobFunction').where({ partnerId }).select()
  await Promise.each(jobFunctions, async jobFunction => {
    if (['admin', 'regionalOfficer', 'labUser'].includes(jobFunction.externalId)) {
      await upsertJobFunctionPermission(knex, jobFunction.id, [modules.inventory.edit])
    } else {
      await upsertJobFunctionPermission(knex, jobFunction.id, [modules.inventory.view])
    }
  })
}
