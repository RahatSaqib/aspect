module.exports = require('../utils').seed(seed)

const { seedNotifications } = require('../utils_sa_nhls')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where('name', 'South Africa NHLS')
    .first()

  const existingNotificationType = await knex('NotificationType')
    .where({
      name: 'Result Data Entered',
      partnerId,
    })
    .first('id')

  if (existingNotificationType) {
    return
  }

  await seedNotifications(knex, { partnerId })
}
