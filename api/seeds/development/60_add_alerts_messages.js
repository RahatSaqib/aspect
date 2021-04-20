const seedIssuesAndAlerts = require('../common/seed_issues_and_alerts')
module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  await seedIssuesAndAlerts(knex, 1)
}
