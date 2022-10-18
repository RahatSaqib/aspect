module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')

const { addFollowUps } = require('../utils')
const followUp = require('../fixtures/FollowUp.json')

async function seed(knex) {
  const now = new Date()

  const partnerIds = await knex('Partner').pluck('id')
  await addFollowUps(knex, followUp, partnerIds)

  const { id: userId } = await knex('User').where('name', 'admin').first('id')

  const results = await knex('Result').select('id')

  const followUps = await knex('FollowUp').select('id')

  await Promise.all(
    _.map(results, async r => {
      await knex('ResultFollowUp').insert({
        resultId: r.id,
        followUpId: followUps[r.id % 3].id,
        date: r.id % 2 ? new Date('2019-09-01') : null,
        createdOn: now,
        createdBy: userId,
        updatedOn: now,
        updatedBy: userId,
      })
    })
  )
}
