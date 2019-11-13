module.exports = require('../utils').seed(seed, __filename, {
  seedsFolder: 'philippines',
  staticDataFiles: ['AssayType'],
})
const { partnerTypeToId } = require('../../src/shared/dictionary')
const geography = require('./fixtures/Geography.json')
const { commonUpserts } = require('../common')

async function seed(knex) {
  const admin = await knex('User')
    .where({ name: 'admin' })
    .first()
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
    admin.id,
    geography,
    'PH',
    'jdk5ctyu8jhwimkvfc99'
  )
}
