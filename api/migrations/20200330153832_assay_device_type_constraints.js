module.exports = require('../src/db').migration(up, down)

async function up(knex) {
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
    jobContext.unique(['jobId', 'assayTypeId'], 'unique_jobId_assayTypeId')
    jobContext.unique(['jobId', 'assayId'], 'unique_jobId_assayId')
    jobContext.unique(['jobId', 'deviceTypeId'], 'unique_jobId_deviceTypeId')
  })
}

async function down(knex) {
  await knex.schema.alterTable('JobContext', jobContext => {
    jobContext.dropUnique(['jobId', 'assayTypeId'], 'unique_jobId_assayTypeId')
    jobContext.dropUnique(['jobId', 'assayId'], 'unique_jobId_assayId')
    jobContext.dropUnique(['jobId', 'deviceTypeId'], 'unique_jobId_deviceTypeId')
    jobContext.dropColumn('assayTypeId')
    jobContext.dropColumn('assayId')
    jobContext.dropColumn('deviceTypeId')
  })
}
