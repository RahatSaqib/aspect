const logger = require('../../src/shared/logger')
const {
  db: { database, ...dbConfigWithoutDatabase },
  seeds,
} = require('../../src/config')

async function recreateDB() {
  // Generate a knex instance without using the schema because maybe it doesn't exist
  const knex = require('knex')({
    client: 'mysql',
    connection: dbConfigWithoutDatabase,
  })

  // eslint-disable-next-line no-console
  console.log('\x1b[1;36m', '⚙️ Recreating db for Schema ➜', database)
  // eslint-disable-next-line no-console
  console.log('\x1b[1;36m', '⚙️ Seed Directories ➜', seeds.directory)
  await knex.raw(`DROP DATABASE IF EXISTS ${database};`)
  await knex.raw(`CREATE DATABASE ${database};`)
}

recreateDB().then(
  () => process.exit(0),
  err => {
    logger.error(err)
    process.exit(1)
  }
)
