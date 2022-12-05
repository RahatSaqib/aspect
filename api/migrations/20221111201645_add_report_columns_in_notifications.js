/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('Notification', notification => {
    notification.integer('reportId').after('resultId').unsigned().nullable().index().references('id').inTable('Report')
    notification.string('reportFileName').after('webhookMessageId').nullable()
    notification.string('reportToken', 2000).after('reportFileName').nullable()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('Notification', notification => {
    notification.dropForeign('reportId')
    notification.dropColumns('reportId', 'reportFileName', 'reportToken')
  })
}
