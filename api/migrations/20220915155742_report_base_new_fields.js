module.exports.up = async function (knex) {
  await knex.schema.alterTable('Report', report => {
    report.boolean('availableForNotification').notNullable().defaultTo(1)
  })
  await knex.schema.alterTable('NotificationType', notificationType => {
    notificationType.string('cronRecurrency', 50)
    notificationType
      .integer('reportId')
      .after('issueTypeId')
      .unsigned()
      .nullable()
      .index()
      .references('id')
      .inTable('Report')
  })
}

module.exports.down = async function (knex) {
  await knex.schema.alterTable('Report', notificationType => {
    notificationType.dropColumn('availableForNotification')
  })
  await knex.schema.alterTable('NotificationType', report => {
    report.dropForeign('reportId')
    report.dropColumns('cronRecurrency', 'reportId')
  })
}
