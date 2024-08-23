const logger = require('./shared/logger')

const jobStrategies = {
  asyncReports: async job => {
    // Function calling to generate async reports will come here.
    return job.state
  },
  testJobName: async job => {
    // Test job will be removed after real job is added.
    logger.info('Test job name')
    return job.id
  },
  // Add more job strategies here
}

module.exports = async job => {
  const strategy = jobStrategies[job.name]
  if (strategy) {
    return strategy(job)
  }
  return true
}
