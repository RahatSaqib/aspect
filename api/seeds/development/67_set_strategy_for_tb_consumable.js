module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  await knex('Consumable')
    .update({ strategy: 'withLotAndExpirationDateStrategy' })
    .where('externalId', 'GxMtbRifCartridge')
}
