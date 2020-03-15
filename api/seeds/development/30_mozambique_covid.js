module.exports = require('../utils').seed(seed, __filename)

const bcrypt = require('bcrypt')

const utils = require('../utils')
const config = require('../../src/config')
const {
  allFeatureToId,
  partnerTypeToId,
} = require('../../src/shared/dictionary')
const geography = require('./fixtures/geography.json')
const { commonUpserts } = require('../common')
const { upsertCovidAssay } = require('../commonCovid')

// const {
//   getRandomResults,
//   createDevicesForAllMissingTypes,
// } = require('../commonGenerateResults')

module.exports = require('../utils').seed(seed, __filename)

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  utils.hasSeededStaticData = true

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'moz_admin',
    password: bcrypt.hashSync('moz123', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const [partnerId] = await knex('Partner').insert({
    name: 'Mozambique',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    serverUrl: 'http://localhost:8000/',
    plugin: 'mozambique',
  })

  await commonUpserts(
    knex,
    partnerId,
    adminId,
    {
      countries: [
        geography.countries.find(country => country.abbreviation === 'MZ'),
      ],
    },
    'MZ'
  )

  // Give permission to dashboard, browse, sites, results, devices, reporters
  const { id: jobFunctionIdAdmin } = await knex('JobFunction')
    .where('name', 'Admin')
    .where({ partnerId })
    .first('id')

  const { id: jobFunctionIdRegionalOfficer } = await knex('JobFunction')
    .where('name', 'Regional Officer')
    .where({ partnerId })
    .first('id')

  const { id: jobFunctionIdLabUser } = await knex('JobFunction')
    .where('name', 'Lab User')
    .where({ partnerId })
    .first('id')

  const featureModules = await allFeatureToId()
  await knex('JobFunctionFeature').insert([
    // Admin Permissions
    {
      jobFunctionId: jobFunctionIdAdmin,
      featureId: featureModules.summaryDashboard,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      featureId: featureModules.account,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      featureId: featureModules.resultDashboard,
    },
    // Regional Officer Permissions
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      featureId: featureModules.summaryDashboard,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      featureId: featureModules.account,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      featureId: featureModules.resultDashboard,
    },
    // Lab User Permissions
    {
      jobFunctionId: jobFunctionIdLabUser,
      featureId: featureModules.summaryDashboard,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      featureId: featureModules.account,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      featureId: featureModules.resultDashboard,
    },
  ])

  const modules = await utils.getPermissionModules(knex)
  await knex('JobFunctionPermission').insert([
    // Admin Permissions
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.demo.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.deviceApiKey.admin,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.issue.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.inventory.admin,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.task.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.patient.admin },
    // Regional Officer Permissions
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.device.admin,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.result.admin,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.site.admin,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.issue.admin,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.inventory.admin,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.task.admin,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.patient.edit,
    },
    // Lab User Permissions
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.device.admin,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.result.admin,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.site.admin,
    },
    { jobFunctionId: jobFunctionIdLabUser, permissionId: modules.issue.admin },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.inventory.admin,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.task.admin,
    },
    { jobFunctionId: jobFunctionIdLabUser, permissionId: modules.patient.edit },
  ])

  await upsertCovidAssay(knex)

  // const auditFields = {
  //   createdOn: now,
  //   createdBy: adminId,
  //   updatedOn: now,
  //   updatedBy: adminId,
  // }
}
