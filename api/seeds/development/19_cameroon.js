module.exports = require('../utils').seed(seed, __filename)

const bcrypt = require('bcrypt')

const utils = require('../utils')
const { seedCheckTbAppWebHook } = require('../utils_cameroon')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const geography = require('./fixtures/geography.json')
const { commonUpserts } = require('../common')
const jobFunctionsFixtureCameroon = require('./fixtures/jobFunctions_cameroon')

module.exports = require('../utils').seed(seed, __filename)

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  utils.hasSeededStaticData = true

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'cm_admin',
    password: bcrypt.hashSync('Cameroon123', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const [partnerId] = await knex('Partner').insert({
    name: 'Cameroon',
    externalId: 'cameroon',
    partnerTypeId: await partnerTypeToId('operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    serverUrl: 'http://localhost:8000/',
    plugin: 'cameroon',
  })

  await commonUpserts(
    knex,
    partnerId,
    adminId,
    {
      countries: [geography.countries.find(country => country.abbreviation === 'CM')],
    },
    'CM',
    null,
    {
      fixtures: {
        jobFunctions: jobFunctionsFixtureCameroon,
      },
    }
  )

  // Grant access to sites
  // Reuse previously seeded "static" data
  const { id: permissionSiteEditId } = await knex('Permission')
    .where('module', 'site')
    .where('activity', 'edit')
    .first('id')

  const { id: jobFunctionIdSuperAdmin } = await knex('JobFunction').where('name', 'Super Admin').first('id')

  if (
    !(await knex('JobFunctionPermission')
      .where('jobFunctionId', jobFunctionIdSuperAdmin)
      .where('permissionId', permissionSiteEditId))
  ) {
    await knex('JobFunctionPermission').insert([
      {
        jobFunctionId: jobFunctionIdSuperAdmin,
        permissionId: permissionSiteEditId,
      },
    ])
  }

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  await seedCheckTbAppWebHook(knex, { partnerId, auditFields })
}
