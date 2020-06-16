module.exports = require('../utils').seed(seed, __filename)
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const geography = require('./fixtures/geography.json')
const { commonUpserts } = require('../common')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  const now = new Date()
  // Create admin user and audit fields
  const [partnerId] = await knex('Partner').insert({
    name: 'Ukraine',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    serverUrl: 'https://nigeria.aspect.id', // WHAT SHOULD I PUT HERE???????
  })

  const [adminId] = await knex('User').insert({
    name: 'admin',
    password: bcrypt.hashSync('bC2B04ABra', saltRounds),
    approved: 1,
    lockedOut: 0,
    failedPasswordAttempts: 0,
    createdOn: now,
  })

  await commonUpserts(
    knex,
    partnerId,
    adminId,
    geography,
    'UA',
    'q5zh29mw0a01zkqzq1yg'
  )

  const { id: countryId } = await knex('Country')
    .where({ abbreviation: 'UA' })
    .first()
  await knex('Geography').insert({
    countryId,
  })
}
