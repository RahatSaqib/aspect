module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('NotificationTypeCategory', tbl => {
    tbl.increments('id')
    tbl.string('name', 150).notNullable()
    tbl.string('externalId', 150).notNullable().index()
    tbl.json('triggerCondition').nullable()
  })
  await knex.schema.alterTable('NotificationType', tbl => {
    tbl
      .integer('notificationTypeCategoryId')
      .unsigned()
      .index()
      .references('id')
      .inTable('NotificationTypeCategory')
      .nullable()
    tbl.dropForeign('issueTypeId')
    tbl
      .integer('issueTypeId')
      .index()
      .unsigned()
      .references('id')
      .inTable('IssueType')
      .nullable()
      .alter()
    tbl.json('filterCondition').nullable()
  })
  await knex.schema.alterTable('Notification', tbl => {
    tbl.dropForeign('issueId')
    tbl
      .integer('issueId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Issue')
      .nullable()
      .alter()
    tbl
      .integer('resultId')
      .unsigned()
      .references('id')
      .inTable('Result')
      .nullable()
    tbl.json('data').nullable()
  })
}

async function down(knex) {
  await knex.schema.alterTable('NotificationType', tbl => {
    tbl.dropForeign('notificationTypeCategoryId')
    tbl.dropColumn('notificationTypeCategoryId')
    tbl.dropForeign('issueTypeId')
    tbl
      .integer('issueTypeId')
      .unsigned()
      .references('id')
      .inTable('IssueType')
      .notNullable()
      .alter()
    tbl.dropColumn('filterCondition')
  })

  await knex.schema.dropTableIfExists('NotificationTypeCategory')

  await knex.schema.alterTable('Notification', tbl => {
    tbl.dropForeign('issueId')
    tbl
      .integer('issueId')
      .unsigned()
      .references('id')
      .inTable('Issue')
      .notNullable()
      .alter()
    tbl.dropForeign('resultId')
    tbl.dropColumn('resultId')
    tbl.dropColumn('data')
  })
}
