require('dotenv-safe').load()

module.exports = {
  secret: process.env.secret,
  passwordAttempts: process.env.passwordAttempts,
  passwordSaltRounds: process.env.passwordSaltRounds,
  gxAlertApi: process.env.gxAlertApi,
  db: {
    connectionLimit: parseInt(process.env['db.connectionLimit'], 10) || 10,
    host: process.env['db.host'],
    user: process.env['db.user'],
    port: process.env['db.port'] || 3306,
    password: process.env['db.password'],
    database: process.env['db.databaseName'],
    debug: process.env['db.debug'] === 'true',
  },
  amqp: {
    url: process.env['amqp.url'],
  },
  swagger: {
    uiPath: process.env['swagger.uiPath'] || '',
  },
  sms: {
    twilio: {
      accountSid: process.env.twilioAccountSid,
      authToken: process.env.twilioAuthToken,
      fromNumber: process.env.twilioFromNumber,
      messagingServiceSid: process.env.twilioMessagingServiceSid,
    },
  },
  inventory: {
    daysLeft: {
      stockout: 30, // 'Stock level is projected to run out in under X (30) days'
      stockoutEscalated: 14, // Stock level is projected to run out in under X (14) days
      expiring: 10, // Stock will expire in X days
      expiringEscalated: 3, // Stock will expire in X days
    },
  },
}

configureOptional(module.exports)

// Populates optional configuration
function configureOptional(config) {
  // load logstash
  const logstashEndpoint = process.env['logstash.endpoint']
  if (logstashEndpoint) {
    config.logstash = { endpoint: logstashEndpoint }
  }

  // load sentry
  const ravenDsn = process.env['raven.dsn']
  if (ravenDsn) {
    config.raven = { dsn: ravenDsn }
  }

  // set knex seeds
  const seedsDirectory = process.env['seeds.directory']
  if (seedsDirectory) {
    config.seeds = { directory: seedsDirectory }
  }
}
