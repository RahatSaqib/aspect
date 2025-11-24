module.exports = require('../utils').seed(seed, __filename)

const { populateResultReadOnlyTable } = require('../common/populate_result_read_only_table')

async function seed(knex) {
  await populateResultReadOnlyTable(knex)
}
