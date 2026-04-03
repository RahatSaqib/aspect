module.exports = require('../utils').seed(seed, __filename)

const { populateInstrumentTable } = require('../common/populate_instrument_table')

async function seed(knex) {
  await populateInstrumentTable(knex)
}
