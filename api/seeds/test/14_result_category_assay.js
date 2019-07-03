module.exports = require('../utils').seed(seed, __filename)

const { updateCategoryAssay } = require('../utils')

async function seed(knex) {
  await updateCategoryAssay(knex)
}
