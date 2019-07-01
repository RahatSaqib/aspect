module.exports = require('../utils').seed(seed, 'test_14_result_category_assay')

const { updateCategoryAssay } = require('../utils')

async function seed(knex) {
  await updateCategoryAssay(knex)
}
