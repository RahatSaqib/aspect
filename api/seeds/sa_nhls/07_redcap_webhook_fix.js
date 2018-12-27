module.exports = require('../utils').seed(seed)

async function seed(knex) {
  const redCAPWebhookTemplate = await knex('WebhookTemplate')
    .where('externalId', 'redCapAlereQHiv12Detect')
    .first()
  if (!redCAPWebhookTemplate) {
    return
  }

  await knex('WebhookTemplate')
    .where('id', redCAPWebhookTemplate.id)
    .update({ externalId: 'redCapAlereQ' })
}
