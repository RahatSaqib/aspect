const config = require('./src/config')

module.exports = {
  client: 'mysql',
  connection: config.db,
  seeds: config.seeds,
}
