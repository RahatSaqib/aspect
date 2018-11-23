module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('SmsTemplate', smsTemplate => {
    smsTemplate
      .text('message')
      .notNullable()
      .alter()
  })

  await knex.schema.table('NotificationType', notificationType => {
    notificationType
      .boolean('sendToContactsWithMatchingTags')
      .notNullable()
      .defaultTo(0)
    notificationType
      .integer('jobFunctionId')
      .unsigned()
      .alter()
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

  await knex.schema.table('Notification', notification => {
    notification
      .integer('personId')
      .unsigned()
      .alter()
  })
}
async function down(knex) {
  await knex.schema.table('SmsTemplate', smsTemplate => {
    smsTemplate
      .string('message', 1000)
      .notNullable()
      .alter()
  })

  await knex.schema.table('NotificationType', notificationType => {
    notificationType.dropColumns('sendToContactsWithMatchingTags')
    notificationType
      .integer('jobFunctionId')
      .unsigned()
      .notNullable()
      .alter()
  })

  await knex.schema.dropTableIfExists('NotificationTypeTag')

  await knex.schema.table('Notification', notification => {
    notification
      .integer('personId')
      .unsigned()
      .notNullable()
      .alter()
  })
}
