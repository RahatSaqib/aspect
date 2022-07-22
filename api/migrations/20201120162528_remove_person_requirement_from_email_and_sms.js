module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('SmsMessage', tbl => {
    tbl.dropForeign('personId')
  })
  await knex.schema.table('SmsMessage', tbl => {
    tbl.integer('personId').unsigned().references('id').inTable('Person').alter()
  })
  await knex.schema.alterTable('EmailMessage', tbl => {
    tbl.dropForeign('personId')
  })
  await knex.schema.table('EmailMessage', tbl => {
    tbl.integer('personId').unsigned().references('id').inTable('Person').alter()
    tbl.text('to')
  })
  await knex.schema.table('EmailTemplate', tbl => {
    tbl.text('to')
  })
}

async function down(knex) {
  await knex.schema.alterTable('SmsMessage', tbl => {
    tbl.dropForeign('personId')
  })
  await knex.schema.table('SmsMessage', tbl => {
    tbl.integer('personId').unsigned().notNullable().references('id').inTable('Person').alter()
  })
  await knex.schema.alterTable('EmailMessage', tbl => {
    tbl.dropForeign('personId')
  })
  await knex.schema.table('EmailMessage', tbl => {
    tbl.integer('personId').unsigned().notNullable().references('id').inTable('Person').alter()
    tbl.dropColumn('to')
  })

  await knex.schema.table('EmailTemplate', tbl => {
    tbl.dropColumn('to')
  })
}
