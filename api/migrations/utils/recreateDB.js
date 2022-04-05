const { knex } = require('../../src/db')
const logger = require('../../src/shared/logger')
const {
  db: { database },
} = require('../../src/config')

async function recreateDB() {
  await knex.raw(
    `SET GLOBAL sql_mode=
    "STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION";`
  )
  await knex.raw(`SET GLOBAL time_zone = '+00:00';`)
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
