module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const Promise = require('bluebird')
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { getPermissionModules } = require('../utils')
const geography = require('./fixtures/geography.json')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const { upsertJobFunction } = require('../common')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User')
    .where({ name: 'admin' })
    .first('id')
  if (existingAdminUser) {
    return
  }

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'admin',
    password: bcrypt.hashSync('54wzDZPtOs', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Reuse previously seeded "static" data
  const modules = await getPermissionModules(knex)

  const [partnerId] = await knex('Partner').insert({
    name: 'Zimbabwe',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    serverUrl: 'https://zimbabwe.aspect.id:2843',
  })

  const countries = {}
  await Promise.all(
    _.map(geography.countries, async country => {
      const countryData = _.pick(country, [
        'abbreviation',
        'name',
        'a3',
        'culture',
        'countryCode',
        'timezone',
        'portNumber',
        'exportColumns',
        'inventoryDaysThreshold',
        'monthStartsOnDay',
      ])
      const [countryId] = await knex('Country').insert(countryData)
      countryData.id = countryId
      countries[country.abbreviation] = countryData
      const [countryGeographyId] = await knex('Geography').insert({
        countryId,
      })
      countryData.geographyId = countryGeographyId
    })
  )
  const { culture, timezone, id: countryId, geographyId } = countries.ZW

  const [adminPersonId] = await knex('Person').insert({
    userId: adminId,
    name: 'Admin',
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    geographyId,
    culture,
    timezone,
    ...auditFields,
  })

  const jobFunctionIdAdmin = await upsertJobFunction(knex, 'Admin', partnerId)

  await knex('JobFunctionPermission').insert([
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.browse.view },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.result.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.assay.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.device.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.site.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.person.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.inventory.admin,
    },
  ])

  const [jobIdAdmin] = await knex('Job').insert([
    { personId: adminPersonId, jobFunctionId: jobFunctionIdAdmin },
  ])
  await knex('JobContext').insert({
    jobId: jobIdAdmin,
    geographyId,
  })

  const jobFunctionIdRegionalOfficer = await upsertJobFunction(
    knex,
    'Regional Officer',
    partnerId
  )

  await knex('JobFunctionPermission').insert([
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.browse.view,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.result.admin,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.assay.view,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.device.view,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.site.view,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.person.view,
    },
  ])

  const jobFunctionIdLabUser = await upsertJobFunction(
    knex,
    'Lab User',
    partnerId
  )

  await knex('JobFunctionPermission').insert([
    { jobFunctionId: jobFunctionIdLabUser, permissionId: modules.browse.view },
    { jobFunctionId: jobFunctionIdLabUser, permissionId: modules.result.admin },
    { jobFunctionId: jobFunctionIdLabUser, permissionId: modules.assay.view },
    { jobFunctionId: jobFunctionIdLabUser, permissionId: modules.device.view },
    { jobFunctionId: jobFunctionIdLabUser, permissionId: modules.site.view },
    { jobFunctionId: jobFunctionIdLabUser, permissionId: modules.person.view },
  ])
}
