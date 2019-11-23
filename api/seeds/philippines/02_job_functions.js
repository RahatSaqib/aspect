module.exports = require('../utils').seed(seed, __filename, {
  seedsFolder: 'philippines',
  staticDataFiles: ['AssayType'],
})
const Promise = require('bluebird')
const _ = require('lodash')

const treatmentStatus = require('../fixtures/treatmentStatus.json')
const {
  getPartnerByName,
  getFeatureByModule,
  getPermissonByModuleAndActivity,
} = require('../utils')
const jobFunctions = require('./fixtures/jobFunctions.json')
const { upsertJobFunction } = require('../common')

async function seed(knex) {
  await knex('ResultTreatmentStatus').insert(treatmentStatus)

  const partner = await getPartnerByName(knex, 'Philippines')
  await Promise.each(jobFunctions, async jf => {
    const jobFunction = _.omit(jf, ['features', 'permissions'])
    const featureIds = await Promise.map(jf.features, async feature => {
      const { id: featureId } = await getFeatureByModule(knex, feature)
      return featureId
    })
    const permissionIds = await Promise.map(
      jf.permissions,
      async permission => {
        const { id: permissionId } = await getPermissonByModuleAndActivity(
          knex,
          permission.module,
          permission.activity
        )
        return permissionId
      }
    )
    await upsertJobFunction(
      knex,
      jobFunction.name,
      partner.id,
      permissionIds,
      featureIds
    )
  })
}
