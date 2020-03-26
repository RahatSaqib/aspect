module.exports = require('../utils').seed(seed, __filename)

const { addReports } = require('../utils')

async function seed(knex) {
  await addReports(knex)
}
