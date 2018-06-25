module.exports = require('../../src/db').seed(seed)
const { seedStockIssues } = require('../utils')

async function seed(knex) {
  await seedStockIssues(knex)
}
