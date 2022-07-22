const { addCreateFieldsNullable, addUpdateFieldsNullable, addTimestamps } = require('./utils/index')

module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('PushNotificationTemplate', template => {
    template.increments('id')
    template.string('title', 1000).notNullable()
    template.text('body').notNullable()
    template.text('data')
    addCreateFieldsNullable(template)
    addUpdateFieldsNullable(template)
  })

  await knex.schema.createTable('PushNotificationMessage', message => {
    message.increments('id')
    message
      .integer('pushNotificationTemplateId')
      .unsigned()
      .references('id')
      .inTable('PushNotificationTemplate')
      .notNullable()
    message.integer('messageStatusId').unsigned().references('id').inTable('MessageStatus').notNullable()
    message.integer('personId').unsigned().references('id').inTable('Person').notNullable()
    message.integer('siteId').unsigned().index().references('id').inTable('Site')
    message.integer('deviceId').unsigned().index().references('id').inTable('Device')
    message.integer('resultId').unsigned().index().references('id').inTable('Result')
    message.string('title', 1000)
    message.text('body')
    message.text('data')
    addTimestamps(message)
  })

  await knex.schema.alterTable('Notification', notification => {
    notification
      .integer('pushNotificationMessageId')
      .unsigned()
      .references('id')
      .inTable('PushNotificationMessage')
      .onDelete('SET NULL')
      .after('smsMessageId')
  })

  await knex.schema.alterTable('MessageType', messageType => {
    messageType.integer('pushNotificationTemplateId').unsigned().references('id').inTable('PushNotificationTemplate')
  })
}

async function down(knex) {
  await knex.schema.alterTable('MessageType', t => {
    t.dropForeign('pushNotificationTemplateId')
    t.dropColumn('pushNotificationTemplateId')
  })

  await knex.schema.alterTable('Notification', t => {
    t.dropForeign('pushNotificationMessageId')
    t.dropColumn('pushNotificationMessageId')
  })
  await knex.schema.dropTableIfExists('PushNotificationMessage')
  await knex.schema.dropTableIfExists('PushNotificationTemplate')
}
