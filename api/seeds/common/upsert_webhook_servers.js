const Promise = require('bluebird')

module.exports = async (knex, webhookServersList = [], { userId }) =>
  Promise.each(webhookServersList, async ({ externalId, headers = {}, params = {} }) => {
    const now = new Date()
    const auditFields = {
      createdOn: now,
      createdBy: userId,
      updatedOn: now,
      updatedBy: userId,
    }

    const webhookServer = await knex('WebhookServer').where({ externalId }).first()
    if (!webhookServer) {
      await knex('WebhookServer').insert({
        externalId,
        headers: JSON.stringify(headers),
        params: JSON.stringify(params),
        ...auditFields,
      })
    }
  })
