const upsertResultCategoryGroups = require('../common/upsert_result_category_group')
const fixture = require('../fixtures/ResultCategoryGroupGeneXpert')

module.exports = require('../utils').seed(async knex => {
  await upsertResultCategoryGroups(knex, fixture)
}, __filename)
