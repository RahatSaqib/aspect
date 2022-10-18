module.exports = require('../utils').seed(seed, __filename)

const { addFollowUps } = require('../utils')
const followUp = require('../fixtures/FollowUp.json')

async function seed(knex) {
  const partnerIds = await knex('Partner').pluck('id')
  await addFollowUps(knex, followUp, partnerIds)
}
