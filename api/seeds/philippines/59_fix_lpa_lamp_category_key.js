module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  await knex('Assay')
    .where({ resultCategory1I18nKey: 'resultCategoryMTB' })
    .update({ resultCategory1I18nKey: 'resultCategoryMtb' })
}
