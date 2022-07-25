module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('ResultTreatmentStatus', resultTreatmentStatus => {
    resultTreatmentStatus.increments('id').primary()
    resultTreatmentStatus.string('name').notNullable()
    resultTreatmentStatus.string('externalId').notNullable()
    resultTreatmentStatus.string('i18nKey').notNullable()
  })
  await knex.schema.createTable('ResultTreatmentStatusLog', resultTreatmentStatusLog => {
    resultTreatmentStatusLog.increments('id').primary()
    resultTreatmentStatusLog.integer('resultId').unsigned().index().references('id').inTable('Result')
    resultTreatmentStatusLog
      .integer('resultTreatmentStatusId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('ResultTreatmentStatus')

    resultTreatmentStatusLog.string('data').nullable()
    resultTreatmentStatusLog.string('method').nullable()
    resultTreatmentStatusLog.datetime('changedOn').defaultTo(knex.fn.now())
    resultTreatmentStatusLog.datetime('createdOn').defaultTo(knex.fn.now())
    resultTreatmentStatusLog.integer('createdBy').unsigned().index().references('id').inTable('User')
  })
}

async function down(knex) {
  await knex.schema.alterTable('ResultTreatmentStatusLog', resultTreatmentStatusLog => {
    resultTreatmentStatusLog.dropForeign('createdBy')
    resultTreatmentStatusLog.dropForeign('resultId')
    resultTreatmentStatusLog.dropForeign('resultTreatmentStatusId')
  })
  await knex.schema.dropTable('ResultTreatmentStatus')
  await knex.schema.dropTable('ResultTreatmentStatusLog')
}
