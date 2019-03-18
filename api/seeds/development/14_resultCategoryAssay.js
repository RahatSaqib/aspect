module.exports = require('../utils').seed(seed)

const { updateCategoryAssay } = require('../utils')

async function seed(knex) {
  await updateCategoryAssay(knex)
}
