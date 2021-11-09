module.exports = require('../utils').seed(seed, __filename)
const { assays } = require('./fixtures/partnerData')
const { upsertGeneXpertDeviceTypeAndAssays } = require('../common')

async function seed(knex) {
  await upsertGeneXpertDeviceTypeAndAssays(knex, assays)
}
