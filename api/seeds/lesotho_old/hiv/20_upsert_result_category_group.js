const fixture = require('../../fixtures/resultCategoryGroupBase')
const upsertResultCategoryGroups = require('../../common/upsert_result_category_group')

module.exports = require('../../utils').seed(async knex => upsertResultCategoryGroups(knex, fixture), __filename)
