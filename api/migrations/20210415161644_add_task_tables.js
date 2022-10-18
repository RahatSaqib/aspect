module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('SchedulerTaskExecutionLog', schedulerTaskExecutionLog => {
    schedulerTaskExecutionLog.increments('id')
    schedulerTaskExecutionLog.string('taskName', 200)
    schedulerTaskExecutionLog.dateTime('startDate').defaultTo(knex.fn.now())
    schedulerTaskExecutionLog.dateTime('endDate').nullable()
    schedulerTaskExecutionLog.dateTime('processingDate').nullable().index()
    schedulerTaskExecutionLog.boolean('success').defaultTo(false)
    schedulerTaskExecutionLog.json('errorMessage').nullable()
  })
}

async function down(knex) {
  await knex.schema.dropTableIfExists('SchedulerTaskExecutionLog')
}
