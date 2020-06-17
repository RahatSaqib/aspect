module.exports = require('../utils').seed(seed, __filename)
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const geography = require('./fixtures/geography.json')
const { commonUpserts } = require('../common')
const { upsertJobFunction, upsertJobFunctionPermission } = require('../common')
const { getPermissionModules } = require('../utils')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  const now = new Date()
  // Create country's partner and admin user
  const [partnerId] = await knex('Partner').insert({
    name: 'Ukraine',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    serverUrl: 'https://ukraine.aspect.id',
  })
  const [adminId] = await knex('User').insert({
    name: 'admin',
    password: bcrypt.hashSync('F0Rbq3WtDP', saltRounds), // Manually generated password
    approved: 1,
    lockedOut: 0,
    failedPasswordAttempts: 0,
    createdOn: now,
  })

  // Common upsers
  await commonUpserts(
    knex,
    partnerId,
    adminId,
    geography,
    'UA',
    'qqsmc85rzlaoh9aygzh2' // Manually generated token
  )

  // Add extra/not-common job functions
  const modules = await getPermissionModules(knex)
  const jobFunctionIdClinician = await upsertJobFunction(
    knex,
    'Clinician',
    partnerId
  )
  await upsertJobFunctionPermission(knex, jobFunctionIdClinician, [
    modules.site.view,
    modules.device.view,
    modules.assay.view,
    modules.inventory.view,
    modules.result.edit,
    modules.browse.view,
    modules.treatmentStatus.edit,
    modules.dashboard.report,
    modules.dashboard.siteFilter,
    modules.dashboard.action,
    modules.dashboard.target,
    modules.dashboard.result,
    modules.dashboard.device,
    modules.dashboard.inventory,
    modules.dashboard.site,
    modules.dashboard.summary,
    modules.case.edit,
    modules.account.edit,
    modules.router.edit,
    modules.person.view,
  ])
}
