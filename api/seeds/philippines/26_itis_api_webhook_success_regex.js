module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const { id: adminId } = await knex('User')
    .where({ name: 'admin' })
    .first('id')

  const { id: itisWebhookTemplateId } = await knex('WebhookTemplate')
    .where('externalId', 'itisPushTbExam')
    .first('id')
  await knex('WebhookTemplate').where('id', itisWebhookTemplateId).update({
    okResponseSuccessRegex: 'Add\\sTB\\sExam\\ssuccessfully',
    updatedOn: new Date(),
    updatedBy: adminId,
  })
}
