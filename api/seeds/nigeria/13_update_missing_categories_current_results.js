module.exports = require('../utils').seed(seed, __filename)

const { fixActualGeneXpertHivVlData } = require('../commonGeneXpertHivVl')

async function seed(knex) {
  // It fixes the GxHivVL assay configuration over the actual data and also insert missing categories for it.
  await fixActualGeneXpertHivVlData(knex)
}
