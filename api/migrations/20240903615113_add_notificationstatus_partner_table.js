async function up(knex) {
  await knex.schema.alterTable('Partner', Partner => {
    Partner.string('notificationWarningMessage')
    Partner.string('notificationWarningSendEmails')
  })
}

async function down(knex) {
  await knex.schema.alterTable('Partner', Partner => {
    Partner.dropColumn('notificationWarningMessage')
    Partner.dropColumn('notificationWarningSendEmails')
  })
}

module.exports = {
  up,
  down,
}
