const { upsertTruenatDeviceTypeAndAssays } = require('../commonTruenat')

module.exports = require('../utils').seed(
  async knex => upsertTruenatDeviceTypeAndAssays(knex),
  __filename
)
