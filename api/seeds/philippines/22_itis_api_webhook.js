module.exports = require('../utils').seed(seed, __filename)

const { adminUserName } = require('./fixtures/partnerData')
const { itisWebhookTemplate } = require('./fixtures/webhookTemplate')
const upsertWebHookTemplates = require('../common/upsert_webhook_templates')
const { getPartnerByName } = require('../utils')
const { messageSeverityToId, issueCategoryToId, issueEventStatusToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  const { id: partnerId } = await getPartnerByName(knex, 'Philippines')
  await knex('Partner').where('id', partnerId).update('plugin', 'philippines')
  const now = new Date()
  const { id: adminId } = await knex('User').where({ name: adminUserName }).first('id')

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const [itisWebhookTemplateId] = await upsertWebHookTemplates(knex, [itisWebhookTemplate], adminId)

  const messageSeverityAlertId = await messageSeverityToId('Alert')

  const [resultUpdatedMessageTypeId] = await knex('MessageType').insert([
    {
      messageSeverityId: messageSeverityAlertId,
      webhookTemplateId: itisWebhookTemplateId,
    },
  ])

  const issueCategoryDataHealthId = await issueCategoryToId('DataHealth')

  const [issueTypeResultUpdatedId] = await knex('IssueType').insert({
    name: 'Result Updated',
    externalId: 'ResultUpdated',
    i18nKey: 'issueTypeResultUpdated',
    issueCategoryId: issueCategoryDataHealthId,
  })

  await knex('NotificationType').insert({
    name: 'Result Updated',
    partnerId,
    issueTypeId: issueTypeResultUpdatedId,
    level: 1,
    canAcknowledge: 0,
    messageTypeId: resultUpdatedMessageTypeId,
    ...auditFields,
  })

  await knex('IssueEventTrigger').insert({
    partnerId,
    issueTypeId: issueTypeResultUpdatedId,
    issueEventStatusId: await issueEventStatusToId('Triggered'),
    triggerConditions: JSON.stringify({
      action: 'RESULT_LOGGED',
      conditions: {
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'shouldSendResultToItis',
      },
    }),
    createdOn: auditFields.createdOn,
    updatedOn: auditFields.updatedOn,
  })

  await knex('IssueResolutionTrigger').insert({
    issueTypeId: issueTypeResultUpdatedId,
    partnerId,
    resolutionConditions: JSON.stringify({
      evaluationMethod: 'plugin-function',
      evaluationParameter: 'shouldResolveResultUpdatedIssue',
    }),
    createdOn: auditFields.createdOn,
    updatedOn: auditFields.updatedOn,
  })
}
