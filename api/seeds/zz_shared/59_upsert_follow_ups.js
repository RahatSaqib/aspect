module.exports = require('../utils').seed(seed, __filename)

const { upsertFollowUps } = require('../utils')
const followUp = require('../fixtures/FollowUp.json')

async function seed(knex) {
  const partnerIds = await knex('Partner').pluck('id')
  await upsertFollowUps(knex, followUp, partnerIds)
}
