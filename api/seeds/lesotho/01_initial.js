module.exports = require('../utils').seed(seed, __filename)

const bcrypt = require('bcrypt')
const config = require('../../src/config')
const utils = require('../utils')
const geography = require('./fixtures/geography.json')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const { commonUpserts } = require('../common')
const { upsertGeneXpertDeviceTypeAndAssays } = require('../common')

const { patientData } = require('./fixtures/geneXpertPatientDataSchema.json')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  utils.hasSeededStaticData = true

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'admin',
    password: bcrypt.hashSync('rqbMK458', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const [partnerId] = await knex('Partner').insert({
    name: 'Lesotho',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    serverUrl: 'https://lesotho.aspect.id',
  })
  await commonUpserts(
    knex,
    partnerId,
    adminId,
    geography,
    'LS',
    'AUV294EMDbaeRvAeqZXcbrGW'
  )
  await upsertGeneXpertDeviceTypeAndAssays(
    knex,
    [
      'GxUnknown',
      'GxHiv',
      'GxMtbRif',
      'GxMtbRifUltra',
      'GxHiv1Vl',
      'GxHiv1Qual',
    ],
    patientData
  )
}
