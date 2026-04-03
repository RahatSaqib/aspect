const bcrypt = require('bcrypt')

const utils = require('../utils')
const config = require('../../src/config')
const geography = require('./fixtures/geography.json')
const { commonUpserts } = require('../common')
const jobFunctionsPartnerOne = require('./fixtures/jobFunctions_partnerOne')
const { partner } = require('./fixtures/partnerData')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  utils.hasSeededStaticData = true

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'mw_admin',
    password: bcrypt.hashSync('test07', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const { id: partnerId } = await knex('Partner').where({ externalId: partner.externalId }).first('id')

  await commonUpserts(
    knex,
    partnerId,
    adminId,
    {
      countries: [geography.countries.find(country => country.abbreviation === 'MW')],
    },
    'MW',
    null,
    {
      fixtures: {
        jobFunctions: jobFunctionsPartnerOne,
      },
    }
  )

  // Grant access to sites
  // Reuse previously seeded "static" data
  const { id: permissionSiteEditId } = await knex('Permission')
    .where('module', 'site')
    .where('activity', 'edit')
    .first('id')

  const { id: jobFunctionIdSuperAdmin } = await knex('JobFunction').where('externalId', 'superAdmin').first('id')

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
}

module.exports = require('../utils').seed(seed, __filename)
