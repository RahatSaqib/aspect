module.exports = require('../utils').seed(seed, __filename)

const { adminUserName } = require('./fixtures/partnerData')
const { itisWebhookTemplate } = require('./fixtures/webhookTemplate')
const upsertWebHookTemplates = require('../common/upsert_webhook_templates')

async function seed(knex) {
  const { id: adminId } = await knex('User').where({ name: adminUserName }).first('id')
  await upsertWebHookTemplates(knex, [itisWebhookTemplate], adminId)
}
