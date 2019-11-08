module.exports = require('../utils').seed(seed, __filename, {
  seedsFolder: 'philippines',
  staticDataFiles: ['AssayType'],
})
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const geography = require('./fixtures/geography.json')
const {
  commonUpserts,
  upsertGeneXpertDeviceTypeAndAssays,
} = require('../common')
const { readJson } = require('fs-extra')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

const fixturesPath = `${__dirname}/fixtures/`
const geneXpertDevicePath = `${fixturesPath}geneXpertDevice/`

async function seed(knex) {
  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'admin',
    password: bcrypt.hashSync('xwxg6dhiLU', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })
  const [partnerId] = await knex('Partner').insert({
    name: 'Philippines',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    serverUrl: 'https://philippines.aspect.id',
  })
  await commonUpserts(
    knex,
    partnerId,
    adminId,
    geography,
    'PH',
    'jdk5ctyu8jhwimkvfc99'
  )

  // Upsert GeneExpert device type and assays
  const patientDataSchema = await readJson(
    `${geneXpertDevicePath}/geneXpertPatientDataSchema.json`
  )
  const resultDataSchema = await readJson(
    `${geneXpertDevicePath}/geneXpertResultDataSchema.json`
  )
  await upsertGeneXpertDeviceTypeAndAssays(
    knex,
    ['GxMtbRif', 'GxMtbRifUltra'],
    patientDataSchema,
    resultDataSchema
  )
}
