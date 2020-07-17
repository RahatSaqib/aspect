module.exports = require('../utils').seed(seed, __filename)

const { seedIssueTypeModuleReplaced } = require('../utils')

async function seed(knex) {
  await seedIssueTypeModuleReplaced(knex, {
    userName: 'admin',
  })
}
