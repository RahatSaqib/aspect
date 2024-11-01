const { fixActualGeneXpertHivVlData } = require('../../commonGeneXpertHivVl')

module.exports = async function (knex) {
  // It fixes the GxHivVL assay configuration over the actual data and also insert missing categories for it.
  await fixActualGeneXpertHivVlData(knex)
}
