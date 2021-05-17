const { adminUserName } = require('./fixtures/partnerData')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const { id: adminId } = await knex('User')
    .where({ name: adminUserName })
    .first('id')

  const { id: itisWebhookTemplateId } = await knex('WebhookTemplate')
    .where('externalId', 'itisPushTbExam')
    .first('id')
  await knex('WebhookTemplate').where('id', itisWebhookTemplateId).update({
    okResponseSuccessRegex: '(Add|Update)\\sTB\\sExam\\ssuccessfully',
    updatedOn: new Date(),
    updatedBy: adminId,
  })
}
