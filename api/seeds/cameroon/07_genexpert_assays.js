const { upsertGeneXpertDeviceTypeAndAssays } = require('../common')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  await upsertGeneXpertDeviceTypeAndAssays(
    knex,
    [
      'GxUnknown',
      'GxHcv',
      'GxHiv',
      'GxMtbRif',
      'GxMtbRifUltra',
      'GxHiv1Vl',
      'GxHiv1Qual',
      'GxEbola',
    ],
    {
      id: {
        title: 'Patient ID',
        type: 'string',
        order: 0,
      },
    }
  )
}
