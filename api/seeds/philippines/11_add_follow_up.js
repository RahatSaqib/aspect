module.exports = require('../utils').seed(seed, __filename)
const Promise = require('bluebird')

const { addFollowUps, removeFollowUps } = require('../utils')
const followUp = require('./fixtures/FollowUp.json')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Philippines' })
    .first('id')

  const followUps = await knex('FollowUp')
    .select('externalId')
    .map(p => p.externalId)

  await Promise.each(followUps, async externalId => {
    await removeFollowUps(knex, [partnerId], externalId)
  })

  await addFollowUps(knex, [partnerId], followUp)
}
