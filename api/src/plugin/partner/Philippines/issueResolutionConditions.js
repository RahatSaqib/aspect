const _ = require('lodash')

async function shouldResolveResultUpdatedIssue(knex, issue) {
  const { id, partnerId } = issue
  const sentCheckTbAppNotification = await knex('Issue as i')
    .join('Result as r', 'i.resultId', 'r.id')
    .join('Notification as n', 'i.id', 'n.issueId')
    .join('NotificationType as nt', 'n.notificationTypeId', 'nt.id')
    .join('WebhookMessage as wm', 'n.webhookMessageId', 'wm.id')
    .join('WebhookTemplate as wt', 'wm.webhookTemplateId', 'wt.id')
    .join('MessageStatus as ms', 'wm.messageStatusId', 'ms.id')
    .whereIn('ms.externalId', ['Sent', 'Error'])
    .andWhere('i.id', id)
    .andWhere('nt.partnerId', partnerId)
    .andWhere('wt.externalId', 'itisPushTbExam')
    .first('wm.id as webHookMessageId')
  return !_.isNil(sentCheckTbAppNotification)
}

async function shouldResolveResultUpdatedPatientSmsIssue(knex, issue) {
  const { id, partnerId } = issue
  const sentPatientAdvisory = await knex('Issue as i')
    .join('Result as r', 'i.resultId', 'r.id')
    .join('Notification as n', 'i.id', 'n.issueId')
    .join('NotificationType as nt', 'n.notificationTypeId', 'nt.id')
    .join('SmsMessage as sm', 'n.smsMessageId', 'sm.id')
    .join('SmsTemplate as st', 'sm.smsTemplateId', 'st.id')
    .join('MessageStatus as ms', 'sm.messageStatusId', 'ms.id')
    .whereIn('ms.externalId', ['Sent', 'Error'])
    .andWhere('i.id', id)
    .andWhere('nt.partnerId', partnerId)
    .andWhere('st.externalId', 'patientAdvisorySms')
    .first('sm.id as smsMessageId')
  return !_.isNil(sentPatientAdvisory)
}

module.exports = {
  shouldResolveResultUpdatedIssue,
  shouldResolveResultUpdatedPatientSmsIssue,
}
