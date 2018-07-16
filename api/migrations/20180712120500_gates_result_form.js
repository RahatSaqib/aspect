module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('ResultForm', resultForm => {
    resultForm
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
    resultForm
      .integer('assayId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Assay')
    resultForm.specificType('formSchema', 'JSON')
    resultForm.primary(['partnerId', 'assayId'])
    resultForm.charset('utf8')
  })

  await knex.schema.table('Result', result => {
    result.specificType('formData', 'JSON')
  })
}

async function down(knex) {
  await knex.raw('SET foreign_key_checks = 0')

  await knex.schema.dropTableIfExists('ResultForm')

  await knex.schema.table('Result', result => {
    result.dropColumn('formData')
  })

  await knex.raw('SET foreign_key_checks = 1')
}
