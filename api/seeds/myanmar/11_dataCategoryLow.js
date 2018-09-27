module.exports = require('../utils').seed(seed)

const { seedDataCategory } = require('../dataCategoryLow')

async function seed(knex) {
  await seedDataCategory(knex, 'Myanmar')
}
