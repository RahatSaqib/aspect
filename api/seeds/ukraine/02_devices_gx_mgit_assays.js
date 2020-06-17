module.exports = require('../utils').seed(seed, __filename)
const { upsertMGITDeviceTypeAndAssays } = require('../commonTB')
const { upsertGeneXpertDeviceTypeAndAssays } = require('../common')

async function seed(knex) {
  // GeneXpert
  await upsertGeneXpertDeviceTypeAndAssays(knex, [
    'GxUnknown',
    'GxHcv',
    'GxHiv',
    'GxMtbRif',
    'GxMtbRifUltra',
    'GxHiv1Vl',
    'GxHiv1Qual',
    'GxEbola',
  ])

  // MGIT
  await upsertMGITDeviceTypeAndAssays(knex)
}
