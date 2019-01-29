module.exports = require('../src/db').migration(up, down)

const Promise = require('bluebird')

async function up(knex) {
  await knex.schema.table('SmsTemplate', smsTemplate => {
    smsTemplate
      .text('message')
      .notNullable()
      .alter()
  })

  await knex.schema.table('NotificationType', notificationType => {
    notificationType.dropForeign(['jobFunctionId'])
  })
  await knex.schema.table('NotificationType', notificationType => {
    notificationType
      .boolean('sendToContactsWithMatchingTags')
      .notNullable()
      .defaultTo(0)
    notificationType
      .integer('jobFunctionId')
      .unsigned()
      .references('id')
      .inTable('JobFunction')
      .onDelete('SET NULL')
      .nullable()
      .alter()
  })

  await knex.schema.createTable('NotificationTypeTag', notificationTypeTag => {
    notificationTypeTag
      .integer('notificationTypeId')
      .unsigned()
      .index()
    notificationTypeTag
      .integer('tagId')
      .unsigned()
      .index()
    notificationTypeTag.primary(['notificationTypeId', 'tagId'])
    notificationTypeTag
      .foreign('notificationTypeId')
      .references('NotificationType.id')
    notificationTypeTag.foreign('tagId').references('Tag.id')
  })

  await knex.schema.table('Notification', notificationType => {
    notificationType.dropForeign(['personId'])
  })
  await knex.schema.table('Notification', notification => {
    notification
      .integer('personId')
      .unsigned()
      .references('id')
      .inTable('Person')
      .onDelete('SET NULL')
      .nullable()
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

  const adminJobFunctionPerPartner = await knex('JobFunction')
    .where('name', 'Admin')
    .groupBy('name', 'partnerId')
    .select('id', 'partnerId')

  await Promise.each(adminJobFunctionPerPartner, async adminJobFunction =>
    knex('NotificationType')
      .where('partnerId', adminJobFunction.partnerId)
      .update({ jobFunctionId: adminJobFunction.id })
  )

  await knex.schema.table('NotificationType', notificationType => {
    notificationType.dropForeign(['jobFunctionId'])
  })
  await knex.schema.table('NotificationType', notificationType => {
    notificationType.dropColumns('sendToContactsWithMatchingTags')
    notificationType
      .integer('jobFunctionId')
      .unsigned()
      .references('id')
      .inTable('JobFunction')
      .notNullable()
      .alter()
  })

  await knex.schema.dropTableIfExists('NotificationTypeTag')

  await knex('Notification').whereNull('personId').delete()
  await knex.schema.table('Notification', notificationType => {
    notificationType.dropForeign(['personId'])
  })
  await knex.schema.table('Notification', notification => {
    notification
      .integer('personId')
      .unsigned()
      .references('id')
      .inTable('Person')
      .notNullable()
      .alter()
  })
}
