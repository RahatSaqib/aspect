module.exports = require('../utils').seed(seed, __filename)
const _ = require('lodash')
const Promise = require('bluebird')
const bcrypt = require('bcrypt')
const { allJobFunctionToId } = require('../../src/shared/dictionary')
const {
  adminUserName,
  partnerName,
  adminPassword,
  serverUrl,
  fixtures,
} = require('./fixtures/partnerData')
const config = require('../../src/config')
const geography = require('./fixtures/geography.json')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const { upsertJobFunctionFixture } = require('../common')

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
    name: adminUserName,
    password: bcrypt.hashSync(adminPassword, saltRounds),
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

  const [partnerId] = await knex('Partner').insert({
    name: partnerName,
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 1,
    maxDaysDeviceNoResults: 1,
    serverUrl,
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
  await upsertJobFunctionFixture(knex, fixtures.jobFunctions, partnerId)
  const jobFunctionsById = await allJobFunctionToId()
  const [jobIdAdmin] = await knex('Job').insert({
    personId: adminPersonId,
    jobFunctionId: jobFunctionsById.admin,
  })
  await knex('JobContext').insert({
    jobId: jobIdAdmin,
    geographyId,
  })
  await knex('JobContext').insert({
    jobId: jobIdAdmin,
    geographyId,
  })
}
