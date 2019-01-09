const _ = require('lodash')

async function shouldResolveNewResultAlert(knex, issue) {
  const { resultId } = issue

  if (resultId) {
    const result = await knex('Result as r')
      .join('Issue as i', 'r.id', 'i.resultId')
      .join('IssueType as it', 'i.issueTypeId', 'it.id')
      .where({
        'r.id': resultId,
        'it.externalId': 'ResultUploaded',
      })
      .first('r.formData')

    if (result) {
      const { formData } = result
      if (formData) {
        const formDataObject = JSON.parse(formData)
        if (
          !_.isEmpty(formDataObject) ||
          !_.every(
            _.values(formDataObject),
            formDataValue =>
              _.isEmpty(formDataValue) ||
              _.isNil(formDataValue) ||
              formDataValue === ''
          )
        ) {
          return true
        }
      }
    }
  }
  return false
}

async function shouldResolveResultDataEnteredIssue(knex, issue) {
  // If patient details have been captured for a result,
  // the result is NEGATIVE
  // and the result has been sent to RedCAP
  // then the 'ResultDataEnteredIssue' issue is resolved
  const { id, level, partnerId } = issue
  const sentRedCAPNotification = await knex('Issue as i')
    .join('Result as r', 'i.resultId', 'r.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .join('Notification as n', 'i.id', 'n.issueId')
    .join('NotificationType as nt', 'n.notificationTypeId', 'nt.id')
    .join('WebhookMessage as wm', 'n.webhookMessageId', 'wm.id')
    .join('WebhookTemplate as wt', 'wm.webhookTemplateId', 'wt.id')
    .join('MessageStatus as ms', 'wm.messageStatusId', 'ms.id')
    .where('i.id', id)
    .andWhere('nt.partnerId', partnerId)
    .andWhere('wt.externalId', 'redCapAlereQ')
    .andWhere('ms.externalId', 'Sent')
    .first(
      'rc1.externalId as resultCategory1',
      'rc2.externalId as resultCategory2'
    )
  if (!_.isNil(sentRedCAPNotification)) {
    const positiveResultCategories = [
      'Detected',
      'Trace Detected',
      'LessThan1000',
      'MoreThan1000',
    ]
    const resultNegative =
      !positiveResultCategories.includes(
        sentRedCAPNotification.resultCategory1
      ) &&
      !positiveResultCategories.includes(sentRedCAPNotification.resultCategory2)
    if (resultNegative) {
      return true
    }
    // If the result is POSITIVE,
    // the result has been sent to RedCAP
    // The issue has been escalated above level 1,
    // and all Positive SMS notifications have been sent
    // then the 'ResultDataEnteredIssue' issue is resolved
    if (level > 1) {
      const firstUnsentPositiveSmsNotification = await knex('Issue as i')
        .join('Notification as n', 'i.id', 'n.issueId')
        .join('NotificationType as nt', 'n.notificationTypeId', 'nt.id')
        .join('SmsMessage as sm', 'n.smsMessageId', 'sm.id')
        .join('MessageStatus as ms', 'sm.messageStatusId', 'ms.id')
        .where('i.id', id)
        .andWhere('nt.partnerId', partnerId)
        .andWhere('ms.externalId', '<>', 'Sent')
        .first('sm.id')
      if (_.isNil(firstUnsentPositiveSmsNotification)) {
        return true
      }
    }
  }
  return false
}

module.exports = {
  shouldResolveNewResultAlert,
  shouldResolveResultDataEnteredIssue,
}
