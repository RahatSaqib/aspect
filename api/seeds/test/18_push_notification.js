module.exports = require('../utils').seed(seed, __filename)

const now = new Date()

async function seed(knex) {
  const { id: adminId } = await knex('User')
    .where('name', 'admin')
    .first('id')

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const timeStampFields = {
    createdOn: now,
    updatedOn: now,
  }

  const [newResultsPushNotificationTemplateId] = await knex(
    'PushNotificationTemplate'
  ).insert(
    Object.assign(
      {
        title: 'New Results Available',
        body:
          'There are {{issue.data.numberOfResults}} new results available for site {{site.name}} in Aspect Reporter',
        data: null,
      },
      auditFields
    )
  )

  const { id: messageSeverityId } = await knex('MessageSeverity')
    .where('externalId', 'Recommendation')
    .first('id')

  const [newResultsMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId,
    pushNotificationTemplateId: newResultsPushNotificationTemplateId,
  })

  const { id: issueCategoryId } = await knex('IssueCategory')
    .where('externalId', 'DataHealth')
    .first('id')

  const [newResultsIssueTypeId] = await knex('IssueType').insert({
    name: 'New Results Available',
    externalId: 'NewResultsAvailable',
    i18nKey: 'issueTypeNewResultsAvailable',
    issueCategoryId,
    defaultMessageTypeId: newResultsMessageTypeId,
  })

  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Partner One' })
    .first()

  await knex('NotificationType').insert(
    Object.assign(
      {
        name: 'New Results Available',
        partnerId,
        issueTypeId: newResultsIssueTypeId,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: newResultsMessageTypeId,
      },
      auditFields
    )
  )

  const { id: issueEventStatusId } = await knex('IssueEventStatus')
    .where('externalId', 'Triggered')
    .first('id')

  await knex('IssueEventTrigger').insert(
    Object.assign(
      {
        partnerId,
        issueTypeId: newResultsIssueTypeId,
        issueEventStatusId,
        triggerConditions: JSON.stringify({
          action: 'FACT_NEW_RESULTS_AVAILABLE',
        }),
      },
      timeStampFields
    )
  )

  await knex('IssueResolutionTrigger').insert(
    Object.assign(
      {
        partnerId,
        issueTypeId: newResultsIssueTypeId,
        resolutionConditions: JSON.stringify({
          evaluationMethod: 'issue-age',
          evaluationParameter: { minutes: 24 * 60 - 10 },
        }),
      },
      timeStampFields
    )
  )
}
