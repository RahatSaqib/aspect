const { upsertItems } = require('../utils')
const upsertConsumables = require('../common/upsert_consumables')

module.exports = async knex => upsertConsumables(knex, false)
