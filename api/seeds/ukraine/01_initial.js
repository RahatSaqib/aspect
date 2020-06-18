module.exports = require('../utils').seed(seed, __filename)
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const geography = require('./fixtures/geography.json')
const {
  commonUpserts,
  upsertGeneXpertDeviceTypeAndAssays,
} = require('../common')
const { upsertMGITDeviceTypeAndAssays } = require('../commonTB')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
const adminPassword = 'F0Rbq3WtDP'
const lowerLevelUserPassword = 'TOVpMx3nHP'
const now = new Date()

async function seed(knex) {
  const deviceApiToken = 'qqsmc85rzlaoh9aygzh2'

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
    'UA',
    deviceApiToken,
    {
      password: lowerLevelUserPassword,
    }
  )

  // GeneXpert
  await upsertGeneXpertDeviceTypeAndAssays(knex, [
    'GxUnknown',
    'GxHcv',
    'GxHiv',
    'GxMtbRif',
    'GxMtbRifUltra',
    'GxHiv1Vl',
    'GxHiv1Qual',
    'GxEbola',
  ])

  // MGIT
  await upsertMGITDeviceTypeAndAssays(knex)
}
