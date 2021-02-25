module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('SmsTemplate', tbl => {
    tbl
      .text('phoneNumber', 'mediumtext')
      .notNullable()
      .defaultTo('{{ person.cell }}')
      .alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('SmsTemplate', tbl => {
    tbl.string('phoneNumber').notNullable().defaultTo('{{ person.cell }}')
  })
}
