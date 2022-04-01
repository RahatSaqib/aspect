const updateReports = require('../common/upsert_reports')

module.exports = require('../utils').seed(async knex => {
  await updateReports(knex)
}, __filename)
