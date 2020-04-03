module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('Disease', disease => {
    disease.increments('id')
    disease.string('name').notNullable()
    disease.string('i18nKey').notNullable()
    disease.string('externalId').notNullable()
    disease.unique(['externalId'], 'unique_Disease_externalId')
  })

  await knex.schema.alterTable('AssayType', assayType => {
    assayType
      .integer('diseaseId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Disease')
  })

  await knex.schema.alterTable('JobContext', jobContext => {
    jobContext
      .integer('assayTypeId')
      .unsigned()
      .index()
      .references('id')
      .inTable('AssayType')
    jobContext
      .integer('assayId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Assay')
    jobContext
      .integer('deviceTypeId')
      .unsigned()
      .index()
      .references('id')
      .inTable('DeviceType')
    jobContext
      .integer('diseaseId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Disease')
    jobContext.unique(['jobId', 'assayTypeId'], 'unique_jobId_assayTypeId')
    jobContext.unique(['jobId', 'assayId'], 'unique_jobId_assayId')
    jobContext.unique(['jobId', 'deviceTypeId'], 'unique_jobId_deviceTypeId')
    jobContext.unique(['jobId', 'diseaseId'], 'unique_jobId_diseaseId')
  })
}

async function down(knex) {
  await knex.schema.alterTable('JobContext', jobContext => {
    jobContext.dropUnique(['jobId', 'assayTypeId'], 'unique_jobId_assayTypeId')
    jobContext.dropUnique(['jobId', 'assayId'], 'unique_jobId_assayId')
    jobContext.dropUnique(
      ['jobId', 'deviceTypeId'],
      'unique_jobId_deviceTypeId'
    )
    jobContext.dropUnique(['jobId', 'diseaseId'], 'unique_jobId_diseaseId')
    jobContext.dropForeign('assayTypeId')
    jobContext.dropForeign('assayId')
    jobContext.dropForeign('deviceTypeId')
    jobContext.dropForeign('diseaseId')
    jobContext.dropColumn('assayTypeId')
    jobContext.dropColumn('assayId')
    jobContext.dropColumn('deviceTypeId')
    jobContext.dropColumn('diseaseId')
  })

  await knex.schema.alterTable('AssayType', assayType => {
    assayType.dropForeign('diseaseId')
    assayType.dropColumn('diseaseId')
  })

  await knex.schema.dropTable('Disease')
}
