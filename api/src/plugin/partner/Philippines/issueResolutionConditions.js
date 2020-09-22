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

module.exports = {
  shouldResolveResultUpdatedIssue,
}
