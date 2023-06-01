const fixture = require('./fixtures/partnerData')
const upsertPartnerData = require('../common/upsert_partner_data')

module.exports = require('../utils').seed(async knex => {
  await knex('Partner').where({ name: 'Pakistan' }).update({ name: 'Pakistan NTP' })
  const { id: implementingPartnerTypeId } = await knex('PartnerType').where({ name: 'Implementing' }).first('id')

  await upsertPartnerData(knex, {
    ...fixture,
    partnerName: 'Mercy Corps',
    isDefault: false,
    partnerTypeId: implementingPartnerTypeId,
    fixtures: {}, // Remove jobFunctions
  })
  await upsertPartnerData(knex, {
    ...fixture,
    partnerName: 'IHS',
    isDefault: false,
    partnerTypeId: implementingPartnerTypeId,
    fixtures: {}, // Remove jobFunctions
  })
}, __filename)
