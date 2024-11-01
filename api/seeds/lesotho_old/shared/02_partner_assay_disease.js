const { seedPartnerAssay, seedPartnerDisease } = require('../../utils')

module.exports = async function (knex) {
  await seedPartnerAssay(knex)
  await seedPartnerDisease(knex)
}
