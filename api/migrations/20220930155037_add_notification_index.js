async function up(knex) {
  await knex.schema.raw(`
  ALTER TABLE Notification
    ADD INDEX notification_createdOn_notificationType_index (
      createdOn DESC,
      notificationTypeId)
    `)
}

async function down(knex) {
  await knex.schema.alterTable('Result', tbl => {
    tbl.dropIndex('', 'notification_createdOn_notificationType_index')
  })
}
module.exports = require('../src/db').migration(up, down)
