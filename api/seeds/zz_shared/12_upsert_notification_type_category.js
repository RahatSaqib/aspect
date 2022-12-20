const fixture = require('../fixtures/NotificationTypeCategory.json')
module.exports = require('../utils').seed(seed, `${__filename}-${new Date().toISOString()}`)

async function seed(knex) {
  const existingNotificationTypeCategories = await knex('NotificationTypeCategory').select()

  // Add or update NotificationTypeCategory
  await Promise.all(
    fixture.data.map(async ntc => {
      const exists = existingNotificationTypeCategories.find(ntype => ntype.externalId === ntc.externalId)

      if (exists) {
        return knex('NotificationTypeCategory')
          .where({ externalId: ntc.externalId })
          .update({ ...ntc, triggerCondition: JSON.stringify(ntc.triggerCondition) })
      }
      return knex('NotificationTypeCategory').insert(ntc)
    })
  )
}
