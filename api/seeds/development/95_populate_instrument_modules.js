module.exports = require('../utils').seed(seed, __filename)

const { populateInstrumentModules } = require('../common/populate_instrument_modules')

async function seed(knex) {
  await populateInstrumentModules(knex)
}
