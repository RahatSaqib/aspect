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

// load logstash configuration if provided
function configureLogging(config){
  let endpoint = process.env['logstash.endpoint']
  if(endpoint){
    config.logstash = {endpoint}
  }
}
