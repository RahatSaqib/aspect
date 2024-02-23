/* eslint-disable import/no-dynamic-require */
const { getPartnerByExternalId, seed } = require('../utils')

const partnerData = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)
const upsertWebHookServers = require('../common/upsert_webhook_servers')

module.exports = seed(async knex => {
  const {
    partner,
    adminUserName,
    fixtures: { webhookServers = [] },
  } = partnerData
  const { id: partnerId } = await getPartnerByExternalId(knex, partner.externalId)

  const { id: userId } = await knex('User').where({ name: adminUserName }).first('id')
  await upsertWebHookServers(knex, webhookServers, { userId, partnerId })
}, __filename)
