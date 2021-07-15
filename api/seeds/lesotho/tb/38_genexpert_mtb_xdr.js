const {
  upsertGeneXpertDeviceTypeAndAssays,
} = require('../../common')

module.exports = require('../../utils').seed(
  async knex => await upsertGeneXpertDeviceTypeAndAssays(knex, ['GxMtbXDR']),
  __filename
)
