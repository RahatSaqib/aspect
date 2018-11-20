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
  const { resultId, partnerId } = issue

  if (resultId) {
    const { id: resultDataEnteredNotificationTypeId } = await knex(
      'NotificationType'
    )
      .where({ partnerId, name: 'Result Data Entered' })
      .first('id')
    const { id: positiveResultDataEnteredNotificationTypeId } = await knex(
      'NotificationType'
    )
      .where({ partnerId, name: 'Positive Result Data Entered' })
      .first('id')
    const result = await knex('Result as r')
      .join('Issue as i', 'r.id', 'i.resultId')
      .join('IssueType as it', 'i.issueTypeId', 'it.id')
      .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
      .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
      .leftJoin('Notification as redCapN', function() {
        this.on('i.id', 'redCapN.issueId').andOn(
          'redCapN.notificationTypeId',
          knex.raw(resultDataEnteredNotificationTypeId)
        )
      })
      .leftJoin(
        'WebhookMessage as redCapWhm',
        'redCapN.webhookMessageId',
        'redCapWhm.id'
      )
      .leftJoin(
        'MessageStatus as redCapMs',
        'redCapWhm.messageStatusId',
        'redCapMs.id'
      )
      .leftJoin('Notification as posSmsN', function() {
        this.on('i.id', 'posSmsN.issueId').andOn(
          'posSmsN.notificationTypeId',
          knex.raw(positiveResultDataEnteredNotificationTypeId)
        )
      })
      .leftJoin('SmsMessage as posSmsM', 'posSmsN.smsMessageId', 'posSmsM.id')
      .leftJoin(
        'MessageStatus as posSmsMs',
        'posSmsM.messageStatusId',
        'posSmsMs.id'
      )
      .where({
        'r.id': resultId,
        'it.externalId': 'ResultDataEntered',
      })
      .first(
        'rc1.externalId as resultCategory1',
        'rc2.externalId as resultCategory2',
        'i.level',
        'redCapMs.externalId as redCapWebhookMessageStatus',
        'posSmsMs.externalId as resultPositiveSmsMessageStatus'
      )

    if (result) {
      const positiveResultCategories = [
        'Detected',
        'Trace Detected',
        'LessThan1000',
        'MoreThan1000',
      ]
      const resultPositive =
        positiveResultCategories.includes(result.resultCategory1) ||
        positiveResultCategories.includes(result.resultCategory2)
      if (
        resultPositive &&
        result.resultPositiveSmsMessageStatus === 'Sent' &&
        result.level === 2
      ) {
        return true
      }
      if (result.redCapWebhookMessageStatus === 'Sent') {
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
