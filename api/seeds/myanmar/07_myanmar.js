module.exports = require('../../src/db').seed(seed)
const { seedDataCategory } = require('../dataCategoryLow')

// TODO: Remove the following two ESLint ignore-settings when implementing seeds
/* eslint no-unused-vars: 0 */
/* eslint no-empty-function: 0 */
async function seed(knex) {
  // Data Category
  await seedDataCategory(knex, 'Myanmar')
}
