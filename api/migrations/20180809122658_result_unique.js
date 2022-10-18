module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('Result', result => {
    result.unique(['externalId', 'deviceId'])
  })

  await knex.schema.createTable('AuditLog', auditLog => {
    auditLog.increments('id')
    auditLog.string('logKey').notNullable()
    auditLog.string('severity').notNullable()
    auditLog.string('userName')
    auditLog.specificType('data', 'JSON')
    auditLog.dateTime('createdOn').notNullable()
  })
}

async function down(knex) {
  await knex.schema.table('Result', result => {
    result.dropUnique(['externalId', 'deviceId'])
  })
  await knex.schema.dropTableIfExists('AuditLog')
}
