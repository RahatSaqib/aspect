const { addCreateFieldsNullable } = require('./utils')

exports.up = async function (knex) {
  await knex.schema.alterTable('Result', table => {
    table.dropForeign('resultWorkflowStatusLogId')
    table.dropColumn('resultWorkflowStatusLogId')
  })
  await knex.schema.alterTable('FactResultsDevice', factResultsDevice => {
    factResultsDevice.dropColumns('resultsDeliveredCount')
  })
  await knex.schema.dropTableIfExists('ResultWorkflowLog')
  await knex.schema.dropTableIfExists('ResultWorkflowStatus')
}

exports.down = async function (knex) {
  await knex.schema.alterTable('FactResultsDevice', factResultsDevice => {
    factResultsDevice.integer('resultsDeliveredCount').unsigned()
  })

  await knex.schema.createTable('ResultWorkflowStatus', resultWorkflowStatus => {
    resultWorkflowStatus.increments('id')
    resultWorkflowStatus.string('name').notNullable()
    resultWorkflowStatus.string('externalId').notNullable()
    resultWorkflowStatus.string('i18nKey')
  })

  await knex.schema.createTable('ResultWorkflowLog', resultWorkflowLog => {
    resultWorkflowLog.increments('id')
    resultWorkflowLog.integer('resultId').unsigned().references('id').inTable('Result')
    resultWorkflowLog
      .integer('resultWorkflowStatusId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('ResultWorkflowStatus')
    resultWorkflowLog.string('reason')
    resultWorkflowLog.string('operator')
    resultWorkflowLog.dateTime('changedOn').notNullable()
    addCreateFieldsNullable(resultWorkflowLog)
  })

  await knex.schema.alterTable('Result', t => {
    t.integer('resultWorkflowStatusLogId')
      .unsigned()
      .nullable()
      .after('deviceId')
      .index()
      .references('id')
      .inTable('ResultWorkflowLog')
      .onDelete('CASCADE')
  })
}
