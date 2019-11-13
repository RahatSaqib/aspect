module.exports = require('../utils').seed(seed, __filename, {
  seedsFolder: 'philippines',
  staticDataFiles: ['AssayType'],
})
const {
  getPartnerByName,
  getFeatureByModule,
  getPermissonByModuleAndActivity,
} = require('../utils')
const { upsertJobFunction } = require('../common')
const { readJson } = require('fs-extra')
const _ = require('lodash')

const fixturesPath = `${__dirname}/fixtures/`

async function seed(knex) {
  // const [modules, features] = await Promise.all([
  //   getPermissionModules(knex),
  //   allFeatureToId(),
  // ])

  // Create admin user and audit fields
  const jobsFunctionsFixture = await readJson(
    `${fixturesPath}/JobsFunctions.json`
  )
  const partner = await getPartnerByName(knex, 'Philippines')

  const promises = jobsFunctionsFixture.map(async jf => {
    const jobFunction = _.omit(jf, ['features', 'permissons'])

    const featurePromises = jf.features.map(async module => {
      const { id: featureId } = await getFeatureByModule(knex, module)
      return featureId
    })
    const featureIds = await Promise.all(featurePromises)

    const permissionPromises = jf.permissions.map(async p => {
      const { id: permissionId } = await getPermissonByModuleAndActivity(
        knex,
        p.module,
        p.activity
      )
      return permissionId
    })
    const permissionIds = await Promise.all(permissionPromises)

    await upsertJobFunction(
      knex,
      jobFunction.name,
      partner.id,
      permissionIds,
      featureIds
    )
  })

  await Promise.all(promises)
}
