module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('ResultTreatmentStatusLog', t => {
    t
      .string('operator')
      .nullable()
      .after('data')
    t
      .string('reason')
      .nullable()
      .after('operator')
  })
  await knex.schema.alterTable('ResultWorkflowLog', t => {
    t
      .string('data')
      .nullable()
      .after('operator')
    t
      .string('method')
      .nullable()
      .after('data')
  })
}

async function down(knex) {
  await knex.schema.alterTable('ResultTreatmentStatusLog', t => {
    t.dropColumn('operator')
    t.dropColumn('reason')
  })
  await knex.schema.alterTable('ResultWorkflowLog', t => {
    t.dropColumn('data')
    t.dropColumn('method')
  })
}
