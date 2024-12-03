const upsertFactCustomFieldCompletion = require('../common/upsert_fact_custom_field_completion_table')

module.exports = require('../utils').seed(async knex => {
  await upsertFactCustomFieldCompletion(knex)
}, __filename)
