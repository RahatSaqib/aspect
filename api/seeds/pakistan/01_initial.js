module.exports = require('../utils').seed(seed, __filename)
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const geography = require('./fixtures/geography.json')
const {
  commonUpserts,
  upsertGeneXpertDeviceTypeAndAssays,
} = require('../common')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
const adminPassword = 'x2KusKKEqR8M'
const lowerLevelUserPassword = '324PoCbqIeBG'
const now = new Date()

async function seed(knex) {
  const deviceApiToken = '77zc0ar862xcys2626w6'

  const [partnerId] = await knex('Partner').insert({
    name: 'Pakistan',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    serverUrl: 'https://pakistan.aspect.id',
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
    'PK',
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
    'assayGXCovid19',
  ])
}
