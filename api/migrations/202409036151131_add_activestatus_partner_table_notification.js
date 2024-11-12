async function up(knex) {
  await knex.schema.alterTable('Partner', Partner => {
    Partner.string('serviceStartDate')
    Partner.string('serviceEndDate')
    Partner.integer('notificationLimit')
  })
}

async function down(knex) {
  await knex.schema.alterTable('Partner', Partner => {
    Partner.dropColumn('serviceStartDate')
    Partner.dropColumn('serviceEndDate')
    Partner.dropColumn('notificationLimit')
  })
}

module.exports = {
  up,
  down,
}
