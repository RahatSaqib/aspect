const upsertConsumables = require('./upsert_consumables')

module.exports = async knex => upsertConsumables(knex, false)
