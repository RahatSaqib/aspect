module.exports = require('../utils').seed(seed, __filename)

const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const geography = require('./fixtures/geography.json')
const { commonUpserts } = require('../common')
const {
  adminUserName,
  adminPassword,
  partnerName,
  serverUrl,
  partnerAbbreviation,
  deviceApiToken,
} = require('./fixtures/partnerData')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User')
    .where({ name: adminUserName })
    .first('id')
  if (existingAdminUser) {
    return
  }

  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: adminUserName,
    password: bcrypt.hashSync(adminPassword, saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const [partnerId] = await knex('Partner').insert({
    name: partnerName,
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    serverUrl,
  })

  await commonUpserts(
    knex,
    partnerId,
    adminId,
    geography,
    partnerAbbreviation,
    deviceApiToken
  )
}
