const _ = require('lodash')

async function shouldRaiseNewResultAlert(knex, action) {
  if (action.resultId) {
    const resultUploadedIssueResults = await knex('Result as r')
      .leftJoin('Issue as i', 'r.id', 'i.resultId')
      .leftJoin('IssueType as it', 'i.issueTypeId', 'it.id')
      .leftJoin('IssueStatus as is', 'i.issueStatusId', 'is.id')
      .leftJoin('IssueEvent as ie', 'i.id', 'ie.issueId')
      .leftJoin('IssueEventStatus as ies', 'ie.issueEventStatusId', 'ies.id')
      .where({
        'r.id': action.resultId,
        'it.externalId': 'ResultUploaded',
      })
      .select(
        'r.id',
        'r.formData',
        'is.externalId as issueStatus',
        'ie.createdOn as issueEventDate',
        'ies.externalId as issueEventStatusId'
      )
    if (_.isEmpty(resultUploadedIssueResults)) {
      return true
    }
    const currentIssueStatus = resultUploadedIssueResults[0].issueStatus
    const latestIssueEventStatus = _.orderBy(
      resultUploadedIssueResults,
      'issueEventDate',
      'desc'
    )[0].issueEventStatusId

    if (
      currentIssueStatus === 'Inactive' &&
      latestIssueEventStatus !== 'Triggered'
    ) {
      if (
        resultUploadedIssueResults[0].formData === null ||
        resultUploadedIssueResults[0].formData === '' ||
        _.isEmpty(JSON.parse(resultUploadedIssueResults[0].formData))
      ) {
        return true
      }
    }
  }
  return false
}

async function shouldSendResultToRedCAP(knex, action) {
  if (action.resultId) {
    const result = await knex('Result as r')
      .where('r.id', action.resultId)
      .first('r.id', 'r.formData')
    if (_.isEmpty(result)) {
      return false
    }
    if (
      result.formData === null ||
      result.formData === '' ||
      _.isEmpty(JSON.parse(result.formData))
    ) {
      return false
    }
    const resultDataEnteredIssueResults = await knex('Issue as i')
      .leftJoin('IssueType as it', 'i.issueTypeId', 'it.id')
      .leftJoin('IssueStatus as is', 'i.issueStatusId', 'is.id')
      .leftJoin('IssueEvent as ie', 'i.id', 'ie.issueId')
      .leftJoin('IssueEventStatus as ies', 'ie.issueEventStatusId', 'ies.id')
      .where({
        'i.resultId': action.resultId,
        'it.externalId': 'ResultDataEntered',
      })
      .select(
        'i.id',
        'is.externalId as issueStatus',
        'ie.createdOn as issueEventDate',
        'ies.externalId as issueEventStatusId'
      )
    if (_.isEmpty(resultDataEnteredIssueResults)) {
      return true
    }
    const currentIssueStatus = resultDataEnteredIssueResults[0].issueStatus
    const latestIssueEventStatus = _.orderBy(
      resultDataEnteredIssueResults,
      'issueEventDate',
      'desc'
    )[0].issueEventStatusId
    if (
      currentIssueStatus === 'Inactive' &&
      latestIssueEventStatus !== 'Triggered'
    ) {
      const previouslySentRedCapNotificationsForResult = await knex(
        'Notification as n'
      )
        .join('WebhookMessage as wm', 'n.webhookMessageId', 'wm.id')
        .join('WebhookTemplate as wt', 'wm.webhookTemplateId', 'wt.id')
        .join('MessageStatus as ms', 'wm.messageStatusId', 'ms.id')
        .where('n.issueId', resultDataEnteredIssueResults[0].id)
        .andWhere('ms.externalId', '<>', 'Error')
        .andWhere('wt.externalId', 'LIKE', 'redCap%')
        .first()
      if (!previouslySentRedCapNotificationsForResult) {
        console.log('2',
          'previouslySentRedCapNotificationsForResult: ',
          previouslySentRedCapNotificationsForResult
        )
        return true
      }
    }
  }
  return false
}

module.exports = {
  shouldRaiseNewResultAlert,
  shouldSendResultToRedCAP,
}
