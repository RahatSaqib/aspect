module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('ResultTreatmentStatus', t => {
    t.increments('id').primary()
    t.string('name').notNullable()
    t.string('externalId').notNullable()
    t.string('i18nKey').notNullable()
  })
  await knex.schema.createTable('ResultTreatmentStatusLog', t => {
    t.increments('id').primary()
    t
      .integer('resultId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Result')
    t
      .integer('resultTreatmentStatusId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('ResultTreatmentStatus')

    t.string('data').nullable()
    t.string('method').nullable()
    t.datetime('changedOn').defaultTo(knex.fn.now())
    t.datetime('createdOn').defaultTo(knex.fn.now())
    t
      .integer('createdBy')
      .unsigned()
      .index()
      .references('id')
      .inTable('User')
  })
}
async function down(knex) {
  await knex.schema.alterTable('ResultTreatmentStatusLog', t => {
    t.dropForeign('createdBy')
    t.dropForeign('resultId')
    t.dropForeign('resultTreatmentStatusId')
  })
  await knex.schema.dropTable('ResultTreatmentStatus')
  await knex.schema.dropTable('ResultTreatmentStatusLog')
}
