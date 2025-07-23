require('dotenv-safe').config({ allowEmptyValues: true })
const _ = require('lodash')
const { IGNORED_SENTRY_ERRORS } = require('./shared/constants')

const port = process.env.PORT || 8080
const host = '127.0.0.1'
const hostName = 'localhost'
module.exports = {
  port,
  host,
  hostName,
  secret: process.env.secret,
  url: `http://${hostName}:${port}`,
  passwordAttempts: process.env.passwordAttempts,
  passwordSaltRounds: process.env.passwordSaltRounds,
  gxAlertRemoteAuthentication: process.env.gxAlertRemoteAuthentication === 'true',
  gxAlertApi: process.env.gxAlertApi,
  isDevelopment: process.env.NODE_ENV === 'development',
  environment: process.env.NODE_ENV,
  countryName: process.env.countryName,
  newRelic: {
    enabled: Boolean(process.env.NEW_RELIC_APP_NAME && process.env.NEW_RELIC_LICENSE_KEY), // Only if this variables are set enable the newrelic and these variables are required ones as well
    appName: process.env.NEW_RELIC_APP_NAME,
    licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
  },
  db: {
    connectionLimit: parseInt(process.env['db.connectionLimit'], 10) || 100,
    host: process.env['db.host'],
    user: process.env['db.user'],
    port: process.env['db.port'] || 3306,
    password: process.env['db.password'],
    database: process.env['db.databaseName'],
    debug: process.env['db.debug'] === 'true',
    timezone: 'UTC',
    ssl: process.env['db.ssl'] === 'true',
  },
  redis: {
    url: process.env['redis.url'] || 'redis://localhost:6379', // until we add redis for all the environments, we will add default value for now.
  },
  log: {
    file: {
      logLevel: process.env['log.file.logLevel'] || 'info',
      labelsWhiteList: process.env['log.file.labelsWhiteList'] || null,
      labelsBlackList: process.env['log.file.labelsBlackList'] || null,
      path: process.env['log.file.path'] || null,
      format: process.env['log.file.format'] || 'text',
    },
    logLevel: process.env['log.console.logLevel'] || 'info',
    format: process.env['log.console.format'] || 'text',
    labelsWhiteList: process.env['log.console.labelsWhiteList'] || null,
    labelsBlackList: process.env['log.console.labelsBlackList'] || null,
    db: {
      enabled: getBooleanOrDefault('log.db.enabled', false),
    },
    mail: { logLevel: process.env['log.mail.logLevel'] || 'alert' },
  },
  file: {
    reference: {
      directory: process.env['file.reference.directory'],
    },
    import: {
      gxAlert: {
        directoryName: process.env['import.gxalert.directory'],
      },
    },
  },
  amqp: {
    url: process.env['amqp.url'],
    name: `${process.env['amqp.name'] || 'aspect'}${process.env['scheduler.enabled'] === 'true' ? '' : '_for_testing'}`,
  },
  messageQueue: {
    name: process.env['messageQueue.name'] || 'aspect',
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
  email: {
    host: process.env['email.host'] || 'smtp.sendgrid.net',
    port: process.env['email.port'] || 2525,
    user: process.env['email.user'],
    password: process.env['email.password'],
    fromEmail: process.env['email.fromEmail'],
  },
  sms: {
    twilio: {
      accountSid: process.env.twilioAccountSid,
      authToken: process.env.twilioAuthToken,
      fromNumber: process.env.twilioFromNumber,
      messagingServiceSid: process.env.twilioMessagingServiceSid,
    },
    adn: {
      api_key: process.env['adn.api_key'] || null,
      api_secret: process.env['adn.api_secret'] || null,
      url: process.env['adn.url'] || null,
    },
    termii: {
      api_key: process.env['termii.api_key'],
      from: process.env['termii.from'],
      channel: process.env['termii.channel'],
      url: process.env['termii.url'],
    },
  },
  admin: {
    email: process.env['admin.email'],
    cell: process.env['admin.cell'],
  },
  manager: {
    email: process.env['manager.email'],
    cell: process.env['manager.cell'],
  },
  plugin: {},
  webhook: {},
  scheduler: {
    enabled: process.env['scheduler.enabled'] === 'true',
    cron: {
      logDeviceMaintenanceStatus: process.env['scheduler.cron.logDeviceMaintenanceStatus'] || '0 18 * * *',
    },
  },
  encryption: {
    passPhrase: process.env['encryption.passPhrase'],
    initVector: process.env['encryption.initVector'],
  },
  pushNotification: {
    testDeviceTokenId: process.env['pushNotification.testDeviceTokenId'],
  },
  aws: {
    accessKeyId: process.env['aws.accessKeyId'],
    secretAccessKey: process.env['aws.secretAccessKey'],
    region: process.env['aws.region'],
    serviceBucket: process.env['aws.serviceBucket'],
  },
  serviceStatusFile: process.env.serviceStatusFile,
  maxDaysDeviceNoResults: 14,
  acceptFakeResults: process.env.acceptFakeResults === 'true',
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
  const sentryDsn = process.env['sentry.dsn']
  if (sentryDsn) {
    config.sentry = {
      dsn: sentryDsn,
      logLevel: process.env['sentry.logLevel'],
      ignoreErrors: getArrayFromString('sentry.ignoreErrors', []).concat(IGNORED_SENTRY_ERRORS),
      sanitizeKeys: getArrayFromString('sentry.sanitizeKeys', [
        'patientId',
        'sampleId',
        'patient',
        'password',
        'email',
        'email2',
        'cell',
      ]),
    }
  }

  // set knex seeds
  const seedsDirectory = process.env['seeds.directory']
  if (seedsDirectory) {
    if (
      !_.includes(seedsDirectory, '/test') &&
      !_.includes(seedsDirectory, '/development') &&
      !_.includes(seedsDirectory, '/daily_new_results')
    )
      config.seeds = { directory: [seedsDirectory, './seeds/zz_shared/'] }
    else config.seeds = { directory: [seedsDirectory] }
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
}

function getBooleanOrDefault(key, defaultValue) {
  const value = process.env[key]
  if (value == null) {
    return defaultValue
  }
  return value === 'true'
}

function getArrayFromString(key, defaultValue) {
  const value = process.env[key]
  if (value == null) {
    return defaultValue
  }
  return value.split('|')
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
