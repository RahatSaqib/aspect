module.exports = require('../utils').seed(seed, __filename)
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const geography = require('./fixtures/geography.json')
const { commonInserts } = require('../common')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'admin',
    password: bcrypt.hashSync('bC2B04ABra', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })
  const [partnerId] = await knex('Partner').insert({
    name: 'Nigeria',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    serverUrl: 'https://nigeria.aspect.id',
  })
  await commonInserts(
    knex,
    partnerId,
    adminId,
    geography,
    'NG',
    'q5zh29mw0a01zkqzq1yg'
  )
}
