const { knex } = require('../../src/db')
const logger = require('../../src/shared/logger')
const {
  db: { database },
} = require('../../src/config')

async function recreateDB() {
  await knex.raw(`DROP DATABASE ${database};`)
  await knex.raw(`CREATE DATABASE ${database};`)
}

recreateDB().then(
  () => process.exit(0),
  err => {
    logger.error(err)
    process.exit(1)
  }
)
