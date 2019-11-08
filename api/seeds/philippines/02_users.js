module.exports = require('../utils').seed(seed, __filename, {
  seedsFolder: 'philippines',
  staticDataFiles: ['AssayType'],
})
const { readJson } = require('fs-extra')

const fixturesPath = `${__dirname}/fixtures/`

async function seed(knex) {
  // Users insert
  const users = await readJson(`${fixturesPath}User.json`)
  await knex('User').insert(users)
}
