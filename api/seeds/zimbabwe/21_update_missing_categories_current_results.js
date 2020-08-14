module.exports = require('../utils').seed(seed, __filename)

const {
  allResultCategoryToId,
  assayToId,
} = require('../../src/shared/dictionary')
const { upsertAssayResultCategories } = require('../common')
async function seed(knex) {
  //It fixes the GxHivVL assay configuration over the actual data and also insert missing categories for it.
  fixActualHivVlData(knex)

}
