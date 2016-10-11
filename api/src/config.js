require('dotenv-safe').load()

module.exports = {
  'secret': process.env.secret,
  'passwordAttempts': process.env.passwordAttempts,
  'passwordSaltRounds': process.env.passwordSaltRounds,
  'db': {
    connectionLimit: process.env['db.connectionLimit'],
    host: process.env['db.host'],
    user: process.env['db.user'],
    password: process.env['db.password'],
    database: process.env['db.databaseName'],
    debug: process.env['db.debug'] === 'true'
  }
}

configureOptional(module.exports)

// Populates optional configuration
function configureOptional(config){
  // load logstash
  let logstashEndpoint = process.env['logstash.endpoint']
  if(logstashEndpoint){
    config.logstash = {endpoint: logstashEndpoint}
  }

  // load sentry
  let ravenDsn = process.env['raven.dsn']
  if(ravenDsn){
    config.raven = {dsn: ravenDsn}
  }

  // set knex seeds
  let seedsDirectory = process.env['seeds.directory']
  if(seedsDirectory){
    config.seeds = {directory: seedsDirectory}
  }
}
