/* eslint-disable import/no-dynamic-require */

const { deviceCapacityFactor } = require(`../${process.env['seeds.directory'].replace(
  './seeds/',
  ''
)}/fixtures/partnerData`)

module.exports = require('../utils').seed(async knex => {
  await knex('Partner').update({
    deviceCapacityFactor,
  })
}, __filename)
