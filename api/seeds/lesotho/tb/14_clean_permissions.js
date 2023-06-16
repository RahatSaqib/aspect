const cleanPermissions = require('../../common/clean_permissions')
const { partner } = require('./fixtures/partnerData')

module.exports = require('../../utils').seed(seed, __filename)

async function seed(knex) {
  await cleanPermissions(knex, partner.externalId)
}
