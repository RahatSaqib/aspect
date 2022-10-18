const NotificationTypeCategory = require('../../fixtures/NotificationTypeCategory.json')
const { upsertFixture } = require('../../common/upsert_Fixture')

module.exports = require('../../utils').seed(
  async knex => upsertFixture(knex, NotificationTypeCategory, 'NotificationTypeCategory'),
  __filename
)
