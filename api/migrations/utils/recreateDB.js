const { knex } = require('../../src/db')
const { db: { database } } = require('../../src/config')

async function recreateDB() {
  await knex.raw(`DROP DATABASE ${database};`)
  await knex.raw(`CREATE DATABASE ${database};`)
}

recreateDB().then(
  () => process.exit(0),
  err => {
    console.error(err) // eslint-disable-line no-console
    process.exit(1)
  }
)
