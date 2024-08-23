const { knex } = require('./db')
const logger = require('./shared/logger')

const jobStrategies = {
  asyncReports: async job => {
    const result = await knex('Result').where({ externalId: job.data.externalId }).first()
    logger.debug(`result: ${JSON.stringify(result)}, job data: ${job.data.externalId}`)
    // Function calling to generate async reports will come here.
    return job.id
  },
  testJobName: async job => {
    // Test job will be removed after real job is added.
    logger.info('Test job name')
    return job.id
  },
  // Add more job strategies here
}

/**
 * Loading jobs from separate file to run jobs in isolated processes and not conflict with the main process.
 * Documentation here: https://docs.bullmq.io/guide/workers/sandboxed-processors
 */
module.exports = async job => {
  const strategy = jobStrategies[job.name]
  if (strategy) {
    return strategy(job)
  }
  return true
}
