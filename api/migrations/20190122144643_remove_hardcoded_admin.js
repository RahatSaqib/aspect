module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('Person', person => {
    person
      .integer('createdBy')
      .unsigned()
      .nullable()
      .alter()
    person
      .integer('updatedBy')
      .unsigned()
      .nullable()
      .alter()
  })

  await knex.schema.table('AlertTemplate', alertTemplate => {
    alertTemplate
      .integer('createdBy')
      .unsigned()
      .nullable()
      .alter()
    alertTemplate
      .integer('updatedBy')
      .unsigned()
      .nullable()
      .alter()
  })

  await knex.schema.table('SmsTemplate', smsTemplate => {
    smsTemplate
      .integer('createdBy')
      .unsigned()
      .nullable()
      .alter()
    smsTemplate
      .integer('updatedBy')
      .unsigned()
      .nullable()
      .alter()
  })

  await knex.schema.table('EmailTemplate', emailTemplate => {
    emailTemplate
      .integer('createdBy')
      .unsigned()
      .nullable()
      .alter()
    emailTemplate
      .integer('updatedBy')
      .unsigned()
      .nullable()
      .alter()
  })

  await knex.schema.table('NotificationType', notificationType => {
    notificationType
      .integer('createdBy')
      .unsigned()
      .nullable()
      .alter()
    notificationType
      .integer('updatedBy')
      .unsigned()
      .nullable()
      .alter()
  })
}

async function down(knex) {
  await knex.schema.table('Person', person => {
    person.dropForeign('createdBy')
    person.dropForeign('updatedBy')
  })

  await knex.schema.table('Person', person => {
    person
      .integer('createdBy')
      .unsigned()
      .references('id')
      .inTable('Person')
      .notNullable()
      .alter()
    person
      .integer('updatedBy')
      .unsigned()
      .references('id')
      .inTable('Person')
      .notNullable()
      .alter()
  })

  await knex.schema.table('AlertTemplate', alertTemplate => {
    alertTemplate.dropForeign('createdBy')
    alertTemplate.dropForeign('updatedBy')
  })
  await knex.schema.table('AlertTemplate', alertTemplate => {
    alertTemplate
      .integer('createdBy')
      .unsigned()
      .references('id')
      .inTable('Person')
      .notNullable()
      .alter()
    alertTemplate
      .integer('updatedBy')
      .unsigned()
      .references('id')
      .inTable('Person')
      .notNullable()
      .alter()
  })

  await knex.schema.table('SmsTemplate', smsTemplate => {
    smsTemplate.dropForeign('createdBy')
    smsTemplate.dropForeign('updatedBy')
  })
  await knex.schema.table('SmsTemplate', smsTemplate => {
    smsTemplate
      .integer('createdBy')
      .unsigned()
      .references('id')
      .inTable('Person')
      .notNullable()
      .alter()
    smsTemplate
      .integer('updatedBy')
      .unsigned()
      .references('id')
      .inTable('Person')
      .notNullable()
      .alter()
  })

  await knex.schema.table('EmailTemplate', emailTemplate => {
    emailTemplate.dropForeign('createdBy')
    emailTemplate.dropForeign('updatedBy')
  })
  await knex.schema.table('EmailTemplate', emailTemplate => {
    emailTemplate
      .integer('createdBy')
      .unsigned()
      .references('id')
      .inTable('Person')
      .notNullable()
      .alter()
    emailTemplate
      .integer('updatedBy')
      .unsigned()
      .references('id')
      .inTable('Person')
      .notNullable()
      .alter()
  })

  await knex.schema.table('NotificationType', notificationType => {
    notificationType.dropForeign('createdBy')
    notificationType.dropForeign('updatedBy')
  })
  await knex.schema.table('NotificationType', notificationType => {
    notificationType
      .integer('createdBy')
      .unsigned()
      .references('id')
      .inTable('Person')
      .notNullable()
      .alter()
    notificationType
      .integer('updatedBy')
      .unsigned()
      .references('id')
      .inTable('Person')
      .notNullable()
      .alter()
  })
}
