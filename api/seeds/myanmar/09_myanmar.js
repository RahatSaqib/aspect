module.exports = require('../../src/db').seed(seed)

const { seedDataCategory } = require('../dataCategoryLow')

async function seed(knex) {
  await seedDataCategory(knex, 'Myanmar')
}
