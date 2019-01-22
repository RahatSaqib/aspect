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
