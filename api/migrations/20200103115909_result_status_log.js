module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.raw('SET foreign_key_checks = 0')

  await knex.schema.createTable('ResultStatus', x => {
    x.increments('id').primary()
    x.string('name').notNullable()
    x.string('externalId').notNullable()
    x.string('i18nKey').notNullable()
  })

  await knex.schema.createTable('ResultStatusLog', x => {
    x.increments('id')
    x.integer('resultId').unsigned().notNullable().index().references('id').inTable('Result')
    x.integer('resultStatusId').unsigned().notNullable().index().references('id').inTable('ResultStatus')
    x.dateTime('createdOn').notNullable()
    x.integer('createdBy').unsigned().index().references('id').inTable('User')
    x.specificType('data', 'JSON')
  })

  await knex.schema.alterTable('Result', x => {
    x.integer('resultStatusLogId').unsigned().index().references('id').inTable('ResultStatusLog')
  })

  await knex.raw('SET foreign_key_checks = 1')
}

async function down(knex) {
  await knex.raw('SET foreign_key_checks = 0')

  await knex.schema.alterTable('Result', x => {
    x.dropForeign('resultStatusLogId')
    x.dropColumns('resultStatusLogId')
  })
  await knex.schema.dropTableIfExists('ResultStatus')
  await knex.schema.dropTableIfExists('ResultStatusLog')

  await knex.raw('SET foreign_key_checks = 1')
}
