module.exports = require('../utils').seed(seed, '14_result_category_assay')

const { updateCategoryAssay } = require('../utils')

async function seed(knex) {
  await updateCategoryAssay(knex)
}
