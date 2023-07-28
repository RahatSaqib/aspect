async function up(knex) {
  await knex.schema.raw(`ALTER TABLE FormType ADD INDEX formType_externalId_index (externalId)`)
}

async function down(knex) {
  await knex.schema.alterTable('FormType', tbl => {
    tbl.dropIndex('', 'formType_externalId_index')
  })
}
module.exports = require('../src/db').migration(up, down)
