module.exports = require('../src/db').migration(up, down)

/**
 * GxConnect daily details now reports the latest system log per instrument module
 * (`instrumentsLogs`), which is a different signal from the last result: a module can be
 * seen by GxConnect without ever producing a result. The log data is kept in its own
 * columns so the result-driven projection stays untouched.
 *
 * lastResultDate becomes nullable because modules can now be discovered from logs before
 * any result has been ingested for them.
 */
async function up(knex) {
  await knex.schema.alterTable('InstrumentModule', table => {
    table.datetime('lastResultDate').nullable().alter()
    table.datetime('lastLogDate').nullable()
    table.string('lastLogDetail', 255).nullable()
  })
}

async function down(knex) {
  await knex.schema.alterTable('InstrumentModule', table => {
    table.dropColumn('lastLogDetail')
    table.dropColumn('lastLogDate')
  })

  await knex('InstrumentModule').whereNull('lastResultDate').del()

  await knex.schema.alterTable('InstrumentModule', table => {
    table.datetime('lastResultDate').notNullable().alter()
  })
}
