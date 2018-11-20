module.exports = require('../src/db').migration(up, down)
// TODO: Remove the following two ESLint ignore-settings when implementing migrations
/* eslint no-unused-vars: 0 */
/* eslint no-empty-function: 0 */
async function up(knex) {
  await knex.schema.table('NotificationType', notificationType => {
    notificationType
      .boolean('sendToContactsWithMatchingTags')
      .notNullable()
      .defaultTo(0)
  })

  await knex.schema.createTable('NotificationTypeTag', notificationTypeTag => {
    notificationTypeTag
      .integer('notificationTypeId')
      .unsigned()
      .index()
      .references('id')
      .inTable('NotificationType')
    notificationTypeTag
      .integer('tagId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Tag')
    notificationTypeTag.primary(['notificationTypeId', 'tagId'])
  })
}
async function down(knex) {
  await knex.schema.table('NotificationType', notificationType => {
    notificationType.dropColumns('sendToContactsWithMatchingTags')
  })

  await knex.schema.dropTableIfExists('NotificationTypeTag')
}
