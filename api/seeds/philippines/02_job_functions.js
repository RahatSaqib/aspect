module.exports = require('../utils').seed(seed, __filename, {
  seedsFolder: 'philippines',
  staticDataFiles: ['AssayType'],
})
const Promise = require('bluebird')
const _ = require('lodash')

const { getPartnerByName, getPermissonByModuleAndActivity } = require('../utils')
const jobFunctions = require('./fixtures/jobFunctions')
const { ensureResultTreatmentStatuses, upsertJobFunction } = require('../common')

async function seed(knex) {
  await ensureResultTreatmentStatuses(knex)

  const partner = await getPartnerByName(knex, 'Philippines')
  await Promise.each(jobFunctions, async jf => {
    const jobFunction = _.omit(jf, ['permissions'])

    const permissionIds = await Promise.map(jf.permissions || [], async permission => {
      const { id: permissionId } = await getPermissonByModuleAndActivity(knex, permission.module, permission.activity)
      return permissionId
    })
    await upsertJobFunction(knex, jobFunction.name, partner.id, permissionIds)
  })
}
