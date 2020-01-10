module.exports = require('../utils').seed(seed, __filename)

const { initDataFromFixture } = require('../utils')

async function seed(knex) {
  await initDataFromFixture(knex, 'ResultWorkflowStatus')
}
