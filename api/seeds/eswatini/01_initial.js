module.exports = require('../utils').seed(seed, __filename)
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const geography = require('./fixtures/geography.json')
const {
  adminUserName,
  adminPassword,
  partnerName,
  serverUrl,
  deviceApiToken,
  lowerLevelUserPassword,
  deviceLogHistoryDays,
  maxDaysDeviceOffline,
  maxDaysDeviceNoResults,
  partnerAbbreviation,
  assays,
} = require('./fixtures/partnerData')
const {
  commonUpserts,
  upsertGeneXpertDeviceTypeAndAssays,
} = require('../common')
const partnerData = require('./fixtures/partnerData')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
const now = new Date()

async function seed(knex) {
  const [partnerId] = await knex('Partner').insert({
    name: partnerName,
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays,
    maxDaysDeviceOffline,
    maxDaysDeviceNoResults,
    serverUrl,
  })

  const [adminId] = await knex('User').insert({
    name: adminUserName,
    password: bcrypt.hashSync(adminPassword, saltRounds),
    approved: 1,
    lockedOut: 0,
    failedPasswordAttempts: 0,
    createdOn: now,
  })

  // Common upserts
  await commonUpserts(
    knex,
    partnerId,
    adminId,
    geography,
    partnerAbbreviation,
    deviceApiToken,
    {
      password: lowerLevelUserPassword,
    },
    partnerData
  )

  // GeneXpert
  await upsertGeneXpertDeviceTypeAndAssays(knex, assays)
}
