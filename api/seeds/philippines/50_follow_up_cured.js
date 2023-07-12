module.exports = require('../utils').seed(seed, __filename)

const { upsertFollowUps } = require('../utils')
const followUp = require('./fixtures/FollowUp.json')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ name: 'Philippines' }).first('id')

  await upsertFollowUps(knex, followUp, [partnerId])
}
