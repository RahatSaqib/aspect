/* eslint-disable import/no-dynamic-require */
const { seed } = require('../utils')
const fixture = require('../fixtures/ConsumableReason')

module.exports = seed(async knex => {
  fixture.data.forEach(async cr => {
    await knex('ConsumableReason').where('name', cr.name).update({ externalId: cr.externalId })
  })
}, __filename)
