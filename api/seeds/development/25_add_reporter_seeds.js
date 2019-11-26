module.exports = require('../utils').seed(seed, __filename)

const reporters = require('../fixtures/reporters.json')
const Promise = require('bluebird')
const _ = require('lodash')

async function seed(knex) {
  await Promise.all(
    _.map(reporters, async report => {
      await knex('RefreshToken').insert({
        ...report,
      })
    })
  )
}
