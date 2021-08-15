module.exports = require('../utils').seed(seed, __filename)
const Promise = require('bluebird')

const fixture = require('./fixtures/FollowUp.json')

async function seed(knex) {
  const followUps = await knex('FollowUp').pluck('externalId')
  await Promise.each(followUps, async externalId => {
    const item = fixture.data.find(it => it.externalId === externalId)
    if (item) {
      await knex('FollowUp').where({ externalId }).update('name', item.name)
    }
  })
}
