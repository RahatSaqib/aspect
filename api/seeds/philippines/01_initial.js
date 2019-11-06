module.exports = require('../utils').seed(seed, __filename)
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const geography = require('./fixtures/geography.json')
const { commonUpserts } = require('../common')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

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
    name: 'Pakistan',
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
    'PK',
    'jdk5ctyu8jhwimkvfc99'
  )
}
