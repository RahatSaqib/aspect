const followUpFixture = require('../fixtures/FollowUp.json')
const { seed, upsertFollowUps } = require('../utils')

module.exports = seed(async knex => upsertFollowUps(knex, followUpFixture), __filename)
