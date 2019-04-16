module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Result', t => {
    t.dropForeign('resultWorkflowStatusId')
    t.dropColumn('resultWorkflowStatusId')
    t
      .integer('resultWorkflowStatusLogId')
      .unsigned()
      .after('deviceId')
      .index()
      .references('id')
      .inTable('ResultWorkflowLog')
      .onDelete('CASCADE')
  })
}
async function down(knex) {
  await knex.schema.alterTable('Result', t => {
    t.dropForeign('resultWorkflowStatusLogId')
    t.dropColumn('resultWorkflowStatusLogId')
    t
      .integer('resultWorkflowStatusId')
      .unsigned()
      .after('deviceId')
      .index()
      .references('id')
      .inTable('ResultWorkflowStatus')
  })
}
