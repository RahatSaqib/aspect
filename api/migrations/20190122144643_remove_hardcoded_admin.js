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
    person
      .integer('createdBy')
      .unsigned()
      .notNullable()
      .alter()
    person
      .integer('updatedBy')
      .unsigned()
      .notNullable()
      .alter()
  })

  await knex.schema.table('AlertTemplate', alertTemplate => {
    alertTemplate
      .integer('createdBy')
      .unsigned()
      .notNullable()
      .alter()
    alertTemplate
      .integer('updatedBy')
      .unsigned()
      .notNullable()
      .alter()
  })

  await knex.schema.table('SmsTemplate', smsTemplate => {
    smsTemplate
      .integer('createdBy')
      .unsigned()
      .notNullable()
      .alter()
    smsTemplate
      .integer('updatedBy')
      .unsigned()
      .notNullable()
      .alter()
  })

  await knex.schema.table('EmailTemplate', emailTemplate => {
    emailTemplate
      .integer('createdBy')
      .unsigned()
      .notNullable()
      .alter()
    emailTemplate
      .integer('updatedBy')
      .unsigned()
      .notNullable()
      .alter()
  })

  await knex.schema.table('NotificationType', notificationType => {
    notificationType
      .integer('createdBy')
      .unsigned()
      .notNullable()
      .alter()
    notificationType
      .integer('updatedBy')
      .unsigned()
      .notNullable()
      .alter()
  })
}
