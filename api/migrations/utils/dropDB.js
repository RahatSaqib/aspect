const logger = require('../../src/shared/logger')
const {
  db: { database },
} = require('../../src/config')
const { knexConnectionWithoutSchema: knex } = require('../../src/db')

async function dropDB() {
  // eslint-disable-next-line no-console
  console.log('\x1b[1;36m', '⚙️ Dropping db Schema ➜', database)
  await knex.raw(`DROP DATABASE IF EXISTS \`${database}\`;`)
}

dropDB().then(
  () => process.exit(0),
  err => {
    logger.error(err)
    process.exit(1)
  }
)
