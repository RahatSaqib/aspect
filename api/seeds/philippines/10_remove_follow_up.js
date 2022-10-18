module.exports = require('../utils').seed(seed, __filename)

const { removeFollowUps } = require('../utils')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ name: 'Philippines' }).first('id')

  await removeFollowUps(knex, [partnerId])
}
