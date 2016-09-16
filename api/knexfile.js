let config = require('./config')

module.exports = {
  client: 'mysql',
  connection: config.db,
  seeds: config.seeds
}
