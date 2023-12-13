module.exports = require('../utils').seed(seed, __filename)

const {
  partner: { externalId },
  excludePattern,
} = require('./fixtures/partnerData')

async function seed(knex) {
  await knex('Partner').where({ externalId }).update({
    excludePattern,
  })
}
