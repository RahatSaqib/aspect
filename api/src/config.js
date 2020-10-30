require('dotenv-safe').config()

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
    timezone: 'UTC',
  },
  log: {
    db: {
      enabled: getBooleanOrDefault('log.db.enabled', false),
    },
  },
  file: {
    reference: {
      directory: process.env['file.reference.directory'],
    },
  },
  amqp: {
    url: process.env['amqp.url'],
    name: process.env['amqp.name'] || 'aspect',
  },
  swagger: {
    enabled: process.env['swagger.enabled'] === 'true',
    schemes: getSwaggerSchemes(
      process.env['swagger.scheme.http'] === 'true',
      process.env['swagger.scheme.https'] === 'true'
    ),
    host: process.env['swagger.host'] || '',
    pathPrefixSize: parseInt(process.env['swagger.pathPrefixSize'] || '1', 10),
    apiUrlSegment: process.env['swagger.apiUrlSegment'] || '',
  },
  sms: {
    twilio: {
      accountSid: process.env.twilioAccountSid,
      authToken: process.env.twilioAuthToken,
      fromNumber: process.env.twilioFromNumber,
      messagingServiceSid: process.env.twilioMessagingServiceSid,
    },
  },
  admin: {
    email: process.env['admin.email'],
    cell: process.env['admin.cell'],
  },
  plugin: {},
  webhook: {},
  scheduler: {
    enabled: process.env['scheduler.enabled'] === 'true',
    cron: {
      logDeviceMaintenanceStatus:
        process.env['scheduler.cron.logDeviceMaintenanceStatus'] ||
        '0 18 * * *',
    },
  },
  encryption: {
    passPhrase: process.env['encryption.passPhrase'],
    initVector: process.env['encryption.initVector'],
  },
  pushNotification: {
    testDeviceTokenId: process.env['pushNotification.testDeviceTokenId'],
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
  const firebase = process.env['firebase.serverKey']
  if (firebase) {
    config.firebase = { serverKey: firebase }
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

  // plugin data
  // TODO load plugin config in plugins
  const commcareApiKey = process.env['plugin.commcare.apiKey']
  if (commcareApiKey) {
    config.plugin.commcare = { apiKey: commcareApiKey }
  }

  const redcapWebApiUrl = process.env['webhook.redcap.url']
  const redcapWebApiAuthToken = process.env['webhook.redcap.authToken']
  if (redcapWebApiUrl && redcapWebApiAuthToken) {
    config.webhook.redcap = {
      url: redcapWebApiUrl,
      authToken: redcapWebApiAuthToken,
    }
  }

  const checkTbAppWebApiUrl = process.env['webhook.checktbapp.url']
  const checkTbAppWebApiAuthKey = process.env['webhook.checktbapp.authKey']
  if (checkTbAppWebApiUrl && checkTbAppWebApiAuthKey) {
    config.webhook.checktbapp = {
      url: checkTbAppWebApiUrl,
      authKey: checkTbAppWebApiAuthKey,
    }
  }

  const philippinesITISWebApiUrl = process.env['webhook.itis.url']
  const philippinesITISSystemKey = process.env['webhook.itis.systemKey']
  if (philippinesITISWebApiUrl && philippinesITISSystemKey) {
    config.webhook.itis = {
      url: philippinesITISWebApiUrl,
      systemKey: philippinesITISSystemKey,
    }
  }

  const uptimeRobotApiKey = process.env['uptimerobot.api.key']
  if (uptimeRobotApiKey) {
    config.uptimerobot = {
      api: {
        key: uptimeRobotApiKey,
      },
    }
  }
}

function getBooleanOrDefault(key, defaultValue) {
  const value = process.env[key]
  if (value == null) {
    return defaultValue
  }
  return value === 'true'
}

function getSwaggerSchemes(httpEnabled, httpsEnabled) {
  const schemes = []
  if (httpEnabled) {
    schemes.push('http')
  }
  if (httpsEnabled) {
    schemes.push('https')
  }
  return schemes
}
