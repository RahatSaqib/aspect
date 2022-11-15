module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  await knex('Consumable')
    .whereIn('externalId', ['DaktariHivVLCartridge', 'DaktariCD4Cartridge'])
    .whereNotIn('id', knex('InventoryItem').distinct('consumableId'))
    .delete()
}
