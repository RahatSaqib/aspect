module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('JobExecutionLog', jobExecutionLog => {
    jobExecutionLog.increments('id')
    jobExecutionLog.string('taskName', 200)
    jobExecutionLog.dateTime('startDate').defaultTo(knex.fn.now())
    jobExecutionLog.dateTime('endDate').nullable()
    jobExecutionLog.dateTime('processingDate').nullable()
    jobExecutionLog.boolean('success').defaultTo(false)
    jobExecutionLog.json('errorMessage').nullable()
  })
}

async function down(knex) {
  await knex.schema.dropTableIfExists('JobExecutionLog')
}
