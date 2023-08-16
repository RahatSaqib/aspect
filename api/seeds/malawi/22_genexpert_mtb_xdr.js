const { upsertGeneXpertDeviceTypeAndAssays } = require('../common')

module.exports = require('../utils').seed(
  async knex => upsertGeneXpertDeviceTypeAndAssays(knex, ['GxMtbXdr']),
  __filename
)
