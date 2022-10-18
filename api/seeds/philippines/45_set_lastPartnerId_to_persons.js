module.exports = require('../utils').seed(seed, __filename)

const { partnerName } = require('./fixtures/partnerData')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ name: partnerName }).first('id')

  await knex('Person').whereNull('lastPartnerId').update({ lastPartnerId: partnerId })
}
