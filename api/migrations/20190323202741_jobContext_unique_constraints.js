module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('JobContext', jobContext => {
    jobContext.unique(['jobId', 'siteId'], 'unique_jobId_siteId')
    jobContext.unique(['jobId', 'geographyId'], 'unique_jobId_geographyId')
  })
}

async function down(knex) {
  await knex.schema.alterTable('JobContext', jobContext => {
    jobContext.dropUnique(['jobId', 'siteId'], 'unique_jobId_siteId')
    jobContext.dropUnique(['jobId', 'geographyId'], 'unique_jobId_geographyId')
  })
}
