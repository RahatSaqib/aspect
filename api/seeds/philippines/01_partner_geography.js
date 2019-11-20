module.exports = require('../utils').seed(seed, __filename, {
  seedsFolder: 'philippines',
  staticDataFiles: ['AssayType'],
})

const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const geography = require('./fixtures/Geography.json')
const { commonUpserts } = require('../common')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User')
    .where({ name: 'admin' })
    .first('id')
  if (existingAdminUser) {
    return
  }

  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'admin',
    password: bcrypt.hashSync('e5wQ40TLzd', saltRounds),
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
}
