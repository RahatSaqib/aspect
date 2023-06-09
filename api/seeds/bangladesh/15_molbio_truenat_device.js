module.exports = require('../utils').seed(seed, __filename)
const {
  partner: { externalId: partnerExternalId },
  adminUserName,
  partnerAbbreviation,
} = require('./fixtures/partnerData')
const truenatDevices = require('./fixtures/truenatDevices.json')
const { upsertTruenatDevices } = require('../commonTruenat')

async function seed(knex) {
  return upsertTruenatDevices(knex, truenatDevices, partnerExternalId, adminUserName, partnerAbbreviation)
}
