const upsertConsumables = require('../common/upsert_consumables')
const partnerData = require('./fixtures/partnerData')

const seed = async knex => {
  await upsertConsumables(knex, true, [], partnerData.consumableStrategies)
}

module.exports = require('../utils').seed(seed, __filename)
