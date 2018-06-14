module.exports = require('../../src/db').seed(seed)

async function seed(knex) {
  await knex('Permission').insert({
    module: 'browse',
    activity: 'view',
  })
}
