async function up(knex) {
  await knex.schema.alterTable('Partner', Partner => {
    Partner.integer('serviceStartDate')
    Partner.string('serviceStartDate')
    Partner.string('notificationLimit')
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
