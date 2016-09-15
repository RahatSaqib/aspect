require('dotenv-safe').load()

module.exports = {
  'secret': process.env.secret,
  'passwordAttempts': process.env.passwordAttempts,
  'db': {
    connectionLimit: process.env['db.connectionLimit'],
    host: process.env['db.host'],
    user: process.env['db.user'],
    password: process.env['db.password'],
    database: process.env['db.databaseName'],
    debug: process.env['db.debug'] === 'true'
  }
}

configureLogging(module.exports)

// load logstash or sentry configuration if provided
function configureLogging(config){
  let logstashEndpoint = process.env['logstash.endpoint']
  if(logstashEndpoint){
    config.logstash = {endpoint: logstashEndpoint}
  }

  let ravenDsn = process.env['raven.dsn']
  if(ravenDsn){
    config.raven = {dsn: ravenDsn}
  }
}
