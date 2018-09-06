module.exports = require('../utils').seed(seed)
const { seedStockIssues } = require('../utils')

async function seed(knex) {
  // check if this seed already ran
  const notificationType = await knex('NotificationType')
    .where({ name: 'LU Stockout' })
    .first()
  if (notificationType) {
    return
  }
  await seedStockIssues(knex)
}
