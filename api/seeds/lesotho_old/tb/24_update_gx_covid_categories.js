module.exports = require('../../utils').seed(seed, __filename)
const { upsertGeneXpertDeviceTypeAndAssays } = require('../../common')

async function seed(knex) {
  await upsertGeneXpertDeviceTypeAndAssays(knex, ['assayGXCovid19'])
}
