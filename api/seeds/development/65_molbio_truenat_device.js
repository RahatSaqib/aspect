module.exports = require('../utils').seed(seed, __filename)
const {
  WK: {
    partnerName,
    adminUserName,
    partnerAbbreviation,
  },
} = require('./fixtures/partnerVariables')
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
