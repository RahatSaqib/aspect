const _ = require('lodash')

async function shouldSendResultToCheckTbApp(knex, action) {
  if (action.resultId) {
    const result = await knex('Result as r')
      .where('r.id', action.resultId)
      .first('r.id')
    if (_.isEmpty(result)) {
      return false
    }
    const resultUpdatedIssueResults = await knex('Issue as i')
      .leftJoin('IssueType as it', 'i.issueTypeId', 'it.id')
      .leftJoin('IssueStatus as is', 'i.issueStatusId', 'is.id')
      .leftJoin('IssueEvent as ie', 'i.id', 'ie.issueId')
      .leftJoin('IssueEventStatus as ies', 'ie.issueEventStatusId', 'ies.id')
      .where({
        'i.resultId': action.resultId,
        'it.externalId': 'ResultUpdated',
      })
      .select(
        'i.id',
        'is.externalId as issueStatus',
        'ie.createdOn as issueEventDate',
        'ies.externalId as issueEventStatusId'
      )
    if (_.isEmpty(resultUpdatedIssueResults)) {
      return true
    }
    const currentIssueStatus = resultUpdatedIssueResults[0].issueStatus
    const latestIssueEventStatus = _.orderBy(
      resultUpdatedIssueResults,
      'issueEventDate',
      'desc'
    )[0].issueEventStatusId
    if (
      currentIssueStatus === 'Inactive' &&
      latestIssueEventStatus !== 'Triggered'
    ) {
      return true
    }
  }
  return false
}

module.exports = {
  shouldSendResultToCheckTbApp,
}
