const upsertPartnerData = require('../common/upsert_partner_data')
const partnerData = require('./fixtures/partnerData')

module.exports = require('../utils').seed(async knex => {
  await upsertPartnerData(knex, partnerData)
}, __filename)
