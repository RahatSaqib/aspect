const Promise = require('bluebird')

const { fileContentTypeToId } = require('../../src/shared/dictionary')

module.exports = async (knex, wehookTemplateData, userId) =>
  Promise.map(wehookTemplateData, async webhookTemplate => {
    const { id: existingWebhookTemplateId } =
      (await knex('WebhookTemplate').where('externalId', webhookTemplate.externalId).first('id')) || {}
    if (existingWebhookTemplateId) {
      await knex('WebhookTemplate')
        .where('id', existingWebhookTemplateId)
        .update({
          ...webhookTemplate,
          fileContentTypeId: await fileContentTypeToId(webhookTemplate.fileContentTypeId),
          updatedOn: new Date(),
          updatedBy: userId,
        })
      return existingWebhookTemplateId
    }
    const [newWebhookTemplateId] = await knex('WebhookTemplate').insert({
      ...webhookTemplate,
      fileContentTypeId: await fileContentTypeToId(webhookTemplate.fileContentTypeId),
      updatedOn: new Date(),
      updatedBy: userId,
      createdOn: new Date(),
      createdBy: userId,
    })
    return newWebhookTemplateId
  })
