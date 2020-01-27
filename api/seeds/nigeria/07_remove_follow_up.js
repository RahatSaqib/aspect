module.exports = require('../utils').seed(seed, __filename)

const { removeFollowUps } = require('../utils')

async function seed(knex) {
  const partnerIds = await knex('Partner')
    .select('id')
    .map(p => p.id)
  await removeFollowUps(knex, partnerIds)
}
