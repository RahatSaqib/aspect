module.exports = require('../utils').seed(seed, __filename)
const { adminUserName } = require('./fixtures/partnerData')
const truenatDevices = require('./fixtures/truenatDevices.json')
const { upsertTruenatDevices } = require('../commonTruenat')

async function seed(knex) {
  return upsertTruenatDevices(knex, truenatDevices, 'wakanda', adminUserName, 'WK')
}
