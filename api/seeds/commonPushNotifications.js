const now = new Date()
async function insertNewResultPushTemplates(
  knex,
  adminId,
  partnerId,
  pushNotification = {
    pushNotificationTemplate: {
      title: 'New Results Available',
      body: 'There are {{issue.data.numberOfResults}} new results for {{site.name}} available in Aspect Reporter',
      data: null,
    },
    messageSeverityExternalId: 'Recommendation',
    issueCategoryExternalId: 'DataHealth',
    issueType: {
      name: 'New Results Available',
      externalId: 'NewResultsAvailable',
      i18nKey: 'issueTypeNewResultsAvailable',
      hasTag: 0,
    },
    notificationType: {
      name: 'New Results Available',
      level: 1,
      canAcknowledge: 0,
    },
    issueEventTrigger: {
      issueEventStatusExternalId: 'Triggered',
      triggerConditions: JSON.stringify({
        action: 'FACT_NEW_RESULTS_AVAILABLE',
      }),
    },
    issueResolutionTrigger: {
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { minutes: 24 * 60 - 10 },
      }),
    },
  }
) {
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
  const lastIssueType = await knex('IssueType')
    .where({ externalId: 'NewResultsAvailable' })
    .first('id as lastIssueType')

  // if this value exists in the db means this was already executed
  if (lastIssueType) return
  const [newResultsPushNotificationTemplateId] = await knex('PushNotificationTemplate').insert({
    ...pushNotification.pushNotificationTemplate,
    ...auditFields,
  })

  const { id: messageSeverityId } = await knex('MessageSeverity')
    .where('externalId', pushNotification.messageSeverityExternalId)
    .first('id')

  const [newResultsMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId,
    pushNotificationTemplateId: newResultsPushNotificationTemplateId,
  })

  const { id: issueCategoryId } = await knex('IssueCategory')
    .where('externalId', pushNotification.issueCategoryExternalId)
    .first('id')

  const [newResultsIssueTypeId] = await knex('IssueType').insert({
    ...pushNotification.issueType,
    issueCategoryId,
    defaultMessageTypeId: newResultsMessageTypeId,
  })

  await knex('NotificationType').insert({
    ...pushNotification.notificationType,
    partnerId,
    issueTypeId: newResultsIssueTypeId,
    messageTypeId: newResultsMessageTypeId,
    ...auditFields,
  })

  const { id: issueEventStatusId } = await knex('IssueEventStatus')
    .where('externalId', pushNotification.issueEventTrigger.issueEventStatusExternalId)
    .first('id')

  await knex('IssueEventTrigger').insert({
    partnerId,
    issueTypeId: newResultsIssueTypeId,
    issueEventStatusId,
    triggerConditions: pushNotification.issueEventTrigger.triggerConditions,
    ...timeStampFields,
  })

  await knex('IssueResolutionTrigger').insert({
    partnerId,
    issueTypeId: newResultsIssueTypeId,
    resolutionConditions: pushNotification.issueResolutionTrigger.resolutionConditions,
    ...timeStampFields,
  })
}

module.exports = {
  insertNewResultPushTemplates,
}
