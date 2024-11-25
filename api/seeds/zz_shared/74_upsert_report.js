// Since missing_cartridges_report is available in pakistan, we will delete it and recreate with new name called unreconciled_inventory_report
module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const missingCartridgesReport = knex('Report').where('externalId', 'missing_cartridges_report').first()

  if (missingCartridgesReport) {
    await missingCartridgesReport.delete()
  }
}
