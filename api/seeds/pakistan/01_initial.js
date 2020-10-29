module.exports = require('../utils').seed(seed, __filename)
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const geography = require('./fixtures/geography.json')
const partnerData = require('./fixtures/partnerData.json')
// const jobFunctions = require('./fixtures/jobFunctions')
const {
  commonUpserts,
  // upsertJobFunctionsFromJson,
  upsertGeneXpertDeviceTypeAndAssays,
} = require('../common')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
const now = new Date()

async function seed(knex) {
  const {
    partnerName,
    serverUrl,
    adminPassword,
    adminUserName,
    lowerLevelUserPassword,
    deviceApiToken,
    partnerAbbreviation,
    assayTypes,
  } = partnerData

  const [partnerId] = await knex('Partner').insert({
    name: partnerName,
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
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
  // / await upsertJobFunctionsFromJson(knex, jobFunctions, partnerId)
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
    }
  )

  // GeneXpert
  await upsertGeneXpertDeviceTypeAndAssays(knex, assayTypes)
}
