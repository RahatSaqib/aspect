const upsertConsumables = require('../common/upsert_consumables')
module.exports = require('../utils').seed(async knex => upsertConsumables(knex, true), __filename)
