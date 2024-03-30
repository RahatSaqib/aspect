/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Before migrate
  await knex.schema.alterTable('JobContext', jobContext => {
    jobContext.integer('personId').unsigned().after('jobId')
    jobContext.integer('jobFunctionId').unsigned().after('personId')
  })

  // Migrate
  await knex('JobContext').update({
    personId: knex('Job').select('personId').where('id', knex.ref('JobContext.jobId')),
    jobFunctionId: knex('Job').select('jobFunctionId').where('id', knex.ref('JobContext.jobId')),
  })

  // After migrate
  await knex.schema.alterTable('JobContext', jobContext => {
    jobContext.dropUnique(['jobId', 'siteId', 'geographyId', 'assayTypeId'], 'unique_jobId_assayTypeId')
    jobContext.dropUnique(['jobId', 'siteId', 'geographyId', 'assayId'], 'unique_jobId_assayId')
    jobContext.dropUnique(['jobId', 'siteId', 'geographyId', 'deviceTypeId'], 'unique_jobId_deviceTypeId')
    jobContext.dropUnique(['jobId', 'siteId', 'geographyId', 'diseaseId'], 'unique_jobId_diseaseId')

    jobContext.unique(['personId', 'jobFunctionId', 'siteId', 'geographyId', 'assayTypeId'], 'unique_jobId_assayTypeId')
    jobContext.unique(['personId', 'jobFunctionId', 'siteId', 'geographyId', 'assayId'], 'unique_jobId_assayId')
    jobContext.unique(
      ['personId', 'jobFunctionId', 'siteId', 'geographyId', 'deviceTypeId'],
      'unique_jobId_deviceTypeId'
    )
    jobContext.unique(['personId', 'jobFunctionId', 'siteId', 'geographyId', 'diseaseId'], 'unique_jobId_diseaseId')

    jobContext.integer('personId').unsigned().index().references('id').inTable('Person').notNullable().alter()
    jobContext.integer('jobFunctionId').unsigned().index().references('id').inTable('JobFunction').notNullable().alter()
    jobContext.dropForeign('jobId')
    jobContext.dropColumn('jobId')
  })
  await knex.schema.dropTable('Job')
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Before migrate
  await knex.schema.createTable('Job', job => {
    job.increments('id')
    job.integer('personId').unsigned().index().references('id').inTable('Person')
    job.integer('jobFunctionId').unsigned().index().references('id').inTable('JobFunction')
    job.unique(['personId', 'jobFunctionId'])
  })
  await knex.schema.alterTable('JobContext', jobContext => {
    jobContext.integer('jobId').unsigned().after('id')
  })

  // Migrate
  const result = await knex('JobContext').select(['personId', 'jobFunctionId']).groupBy(['personId', 'jobFunctionId'])
  await knex('Job').insert(result)
  await knex('JobContext').update({
    jobId: knex('Job')
      .select('id')
      .where('personId', knex.ref('JobContext.personId'))
      .andWhere('jobFunctionId', knex.raw('JobContext.jobFunctionId')),
  })

  // After migrate
  await knex.schema.alterTable('JobContext', jobContext => {
    jobContext.dropUnique(
      ['personId', 'jobFunctionId', 'siteId', 'geographyId', 'assayTypeId'],
      'unique_jobId_assayTypeId'
    )
    jobContext.dropUnique(['personId', 'jobFunctionId', 'siteId', 'geographyId', 'assayId'], 'unique_jobId_assayId')
    jobContext.dropUnique(
      ['personId', 'jobFunctionId', 'siteId', 'geographyId', 'deviceTypeId'],
      'unique_jobId_deviceTypeId'
    )
    jobContext.dropUnique(['personId', 'jobFunctionId', 'siteId', 'geographyId', 'diseaseId'], 'unique_jobId_diseaseId')

    jobContext.unique(['jobId', 'siteId', 'geographyId', 'assayTypeId'], 'unique_jobId_assayTypeId')
    jobContext.unique(['jobId', 'siteId', 'geographyId', 'assayId'], 'unique_jobId_assayId')
    jobContext.unique(['jobId', 'siteId', 'geographyId', 'deviceTypeId'], 'unique_jobId_deviceTypeId')
    jobContext.unique(['jobId', 'siteId', 'geographyId', 'diseaseId'], 'unique_jobId_diseaseId')

    jobContext.dropForeign('personId')
    jobContext.dropForeign('jobFunctionId')
    jobContext.dropColumn('personId')
    jobContext.dropColumn('jobFunctionId')

    jobContext.integer('jobId').unsigned().notNullable().index().references('id').inTable('Job').alter()
  })
}
