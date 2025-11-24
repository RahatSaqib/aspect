const logger = require('../shared/logger')

const testSentryError = async () => {
  try {
    const error = new Error('Test handled error for Sentry')
    error.data = {
      customField: 'test value',
      timestamp: new Date().toISOString(),
    }
    error.name = 'TestSentryError'
    throw error
  } catch (err) {
    logger.error(err)
    // Sentry.captureException(err)
    // throw err
  }
  return null
}

module.exports = { testSentryError }
