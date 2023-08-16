const upsertResultCategoryGroup = require('../common/upsert_result_category_group')
const resultCategoryGroups = require('../fixtures/resultCategoryGroupBase')

module.exports = require('../utils').seed(async knex => {
  await upsertResultCategoryGroup(knex, resultCategoryGroups, ['GxMtbRif', 'GxMtbRifUltra'])
}, __filename)

//
