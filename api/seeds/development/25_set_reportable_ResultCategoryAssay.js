module.exports = require('../utils').seed(seed, __filename)

const { updateReportableInResultCategoryAssay } = require('../utils')

async function seed(knex) {
  await updateReportableInResultCategoryAssay(knex)
}
