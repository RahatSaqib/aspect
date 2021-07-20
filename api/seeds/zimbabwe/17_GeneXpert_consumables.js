const upsertConsumables = require('../common/upsert_consumables')

module.exports = require('../utils').seed(
  knex =>
    upsertConsumables(knex, true, [
      'GxMtbRif',
      'GxMtbRifUltra',
      'GxEbola',
      'GxHiv1Vl',
      'GxHiv1Qual',
      'GxHcv',
      'assayGXCovid19',
    ]),
  __filename
)
