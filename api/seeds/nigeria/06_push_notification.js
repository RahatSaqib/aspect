const { insertNewResultPushTemplates } = require('../commonPushNotifications')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const { id: adminId } = await knex('User').where('name', 'admin').first('id')
  const { id: partnerId } = await knex('Partner').where({ name: 'Nigeria' }).first('id')

  await insertNewResultPushTemplates(knex, adminId, partnerId)
}
