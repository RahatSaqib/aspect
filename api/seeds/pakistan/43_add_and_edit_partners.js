const fixture = require('./fixtures/partnerData')
const upsertPartnerData = require('../common/upsert_partner_data')
const { partner } = require('./fixtures/partnerData')

module.exports = require('../utils').seed(async knex => {
  await knex('Partner').where({ externalId: fixture.partner.externalId }).update({ name: partner.name })
  const { id: implementingPartnerTypeId } = await knex('PartnerType').where({ externalId: 'implementing' }).first('id')

  await upsertPartnerData(knex, {
    ...fixture,
    partner: {
      name: 'Mercy Corps',
      externalId: 'mercyCorps',
    },
    isDefault: false,
    partnerTypeId: implementingPartnerTypeId,
    fixtures: {}, // Remove jobFunctions
  })
  await upsertPartnerData(knex, {
    ...fixture,
    partner: {
      name: 'IHS',
      externalId: 'ihs',
    },
    isDefault: false,
    partnerTypeId: implementingPartnerTypeId,
    fixtures: {}, // Remove jobFunctions
  })
}, __filename)
