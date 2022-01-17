module.exports = require('../utils').seed(seed, __filename)
const {
  partnerName,
  adminUserName,
  partnerAbbreviation,
} = require('./fixtures/partnerData')
const truenatDevices = require('./fixtures/truenatDevices.json')
const { upsertTruenatDevices } = require('../commonTruenat')

async function seed(knex) {
  return upsertTruenatDevices(
    knex,
    truenatDevices,
    partnerName,
    adminUserName,
    partnerAbbreviation
  )
}
