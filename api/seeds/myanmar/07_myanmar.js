module.exports = require('../../src/db').seed(seed)
const { seedStockIssues } = require('../utils')
const { seedDataCategory } = require('../dataCategoryLow')

async function seed(knex) {
  await seedStockIssues(knex)
  
  await seedDataCategory(knex, 'Myanmar')
}
