const { seedTable } = require('../seeds/utils')
module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('NotificationTypeCategory', tbl => {
    tbl.increments('id')
    tbl.string('name', 150).notNullable()
    tbl.string('externalId', 150).notNullable().unique()
    tbl.json('triggerCondition').nullable()
  })
  await seedTable(knex, 'NotificationTypeCategory')
  const { id: notificationTypeCategoryId } = await knex('NotificationTypeCategory')
    .first()
    .where({ externalId: 'issueBased' })
  await knex.schema.alterTable('NotificationType', tbl => {
    tbl
      .integer('notificationTypeCategoryId')
      .unsigned()
      .index()
      .references('id')
      .inTable('NotificationTypeCategory')
      .notNullable()
      .default(notificationTypeCategoryId)
      .after('id')
    tbl.dropForeign('issueTypeId')
    tbl.integer('issueTypeId').index().unsigned().references('id').inTable('IssueType').nullable().alter()
    tbl.json('filterCondition').nullable().after('jobFunctionId')
  })

  await knex.schema.alterTable('Notification', tbl => {
    tbl.dropForeign('issueId')
    tbl.integer('issueId').unsigned().index().references('id').inTable('Issue').nullable().alter()
    tbl.integer('resultId').unsigned().index().references('id').inTable('Result').nullable().after('issueId')
    tbl.json('data').nullable()
  })
}

async function down(knex) {
  await knex.schema.alterTable('NotificationType', tbl => {
    tbl.dropForeign('notificationTypeCategoryId')
    tbl.dropColumn('notificationTypeCategoryId')
    tbl.dropForeign('issueTypeId')
    tbl.dropIndex('issueTypeid')
    tbl.integer('issueTypeId').unsigned().references('id').inTable('IssueType').notNullable().alter()
    tbl.dropColumn('filterCondition')
  })

  await knex.schema.dropTableIfExists('NotificationTypeCategory')

  await knex.schema.alterTable('Notification', tbl => {
    tbl.dropForeign('issueId')
    tbl.dropIndex('issueId')
    tbl.integer('issueId').unsigned().index().references('id').inTable('Issue').notNullable().alter()
    tbl.dropForeign('resultId')
    tbl.dropColumn('resultId')
    tbl.dropColumn('data')
  })
}
