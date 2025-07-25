const config = require('./src/config')

module.exports = {
  client: 'mysql',
  connection: config.db,
  pool: {
    min: 0,
    max: config.db.connectionLimit,
  },
  seeds: config.seeds,
}
