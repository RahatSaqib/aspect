async function up(knex) {
  await knex.schema.alterTable('Partner', Partner => {
    Partner.integer('activeStatus').defaultTo(0)
    Partner.string('statusMessage')
  })
}

async function down(knex) {
  await knex.schema.alterTable('Partner', Partner => {
    Partner.dropColumn('activeStatus')
    Partner.dropColumn('statusMessage')
  })
}

module.exports = {
  up,
  down,
}
