module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Result', t => {
    t.dropForeign('resultWorkflowStatusId')
    t.dropColumn('resultWorkflowStatusId')
    t
      .integer('resultWorkflowStatusLogId')
      .unsigned()
      .nullable()
      .after('deviceId')
      .index()
      .references('id')
      .inTable('ResultWorkflowLog')
      .onDelete('CASCADE')
  })
  await knex.schema.alterTable('ResultWorkflowLog', t => {
    t.dropForeign('resultId')
    t
      .foreign('resultId')
      .references('id')
      .inTable('Result')
      .onDelete('SET NULL')
  })

  // await knex.schema.alterTable('ResultGeneratedResult', t => {
  //   t.dropForeign('sourceResultId')
  //   t
  //     .foreign('sourceResultId')
  //     .references('id')
  //     .inTable('Result')
  //     .onDelete('CASCADE')
  //   t.dropForeign('generatedResultId')
  //   t
  //     .foreign('generatedResultId')
  //     .references('id')
  //     .inTable('Result')
  //     .onDelete('CASCADE')
  // })

  // await knex.schema.alterTable('DeviceLog', t => {
  //   t.dropForeign('deviceId')
  //   t
  //     .foreign('deviceId')
  //     .references('id')
  //     .inTable('Device')
  //     .onDelete('CASCADE')
  // })
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
