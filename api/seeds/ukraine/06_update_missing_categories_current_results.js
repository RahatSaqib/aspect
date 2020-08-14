module.exports = require('../utils').seed(seed, __filename)

const { fixActualHivVlData } = require('../commonHivVl')

async function seed(knex) {
  // It fixes the GxHivVL assay configuration over the actual data and also insert missing categories for it.
  await fixActualHivVlData(knex)
}
