/* eslint-disable import/no-dynamic-require */
const { getPartnerByExternalId, upsertJobFunctionForApi, seed } = require('../utils')

const { partner } = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)

module.exports = seed(async knex => {
  const { id: partnerId } = await getPartnerByExternalId(knex, partner.externalId)
  await upsertJobFunctionForApi(knex, partnerId)
}, __filename)
