const logger = require('../../src/shared/logger')
const {
  db: { database, ...dbConfigWithoutDatabase },
} = require('../../src/config')

async function dropDB() {
  // Generate a knex instance without using the schema because maybe it doesn't exist
  const knex = require('knex')({
    client: 'mysql',
    connection: dbConfigWithoutDatabase,
  })

  const schema = database.replace(/[^_a-zA-Z0-9$_]/g, '_')
  // eslint-disable-next-line no-console
  console.log('\x1b[1;36m', '⚙️ Dropping db Schema ➜', schema)
  await knex.raw(`DROP DATABASE IF EXISTS ${schema};`)
}

dropDB().then(
  () => process.exit(0),
  err => {
    logger.error(err)
    process.exit(1)
  }
)
