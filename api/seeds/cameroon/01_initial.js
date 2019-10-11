module.exports = require('../utils').seed(seed, __filename)

const bcrypt = require('bcrypt')
const config = require('../../src/config')
const utils = require('../utils')
const { seedAbbottM2000AndAssays } = require('../utils_abbott_m2000')
const geography = require('./fixtures/geography.json')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const { commonInserts } = require('../common')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  utils.hasSeededStaticData = true

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'admin',
    password: bcrypt.hashSync('q04TvNf7', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const [partnerId] = await knex('Partner').insert({
    name: 'Cameroon',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    serverUrl: 'https://cameroon.aspect.id',
  })

  await seedAbbottM2000AndAssays(knex)

  await commonInserts(
    knex,
    partnerId,
    adminId,
    geography,
    'CR',
    'Zs4uow3jV0md6cmET0zUY'
  )
}
