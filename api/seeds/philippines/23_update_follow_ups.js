module.exports = require('../utils').seed(seed, __filename)
const Promise = require('bluebird')

const { upsertFollowUps, removeFollowUps } = require('../utils')
const followUp = require('./fixtures/FollowUp.json')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ name: 'Philippines' }).first('id')

  const followUps = await knex('FollowUp').pluck('externalId')

  await Promise.each(followUps, async externalId => {
    await removeFollowUps(knex, [partnerId], externalId)
  })

  await upsertFollowUps(knex, followUp, [partnerId])
}
