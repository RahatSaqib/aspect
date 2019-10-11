const _ = require('lodash')

async function shouldSendResultToCheckTbApp(knex, action) {
  if (action.resultId) {
    const result = await knex('Result as r')
      .join('Assay as a', 'r.assayId', 'a.id')
      .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra'])
      .andWhere('r.id', action.resultId)
      .first('r.id')
    if (_.isEmpty(result)) {
      return false
    }
    const resultUpdatedIssueResults = await knex('Issue as i')
      .leftJoin('IssueType as it', 'i.issueTypeId', 'it.id')
      .leftJoin('IssueStatus as is', 'i.issueStatusId', 'is.id')
      .whereNotIn('is.externalId', ['Inactive', 'Resolved'])
      .andWhere({
        'i.resultId': action.resultId,
        'it.externalId': 'ResultUpdated',
      })
      .select('i.id')
    if (_.isEmpty(resultUpdatedIssueResults)) {
      return true
    }
  }
  return false
}

module.exports = {
  shouldSendResultToCheckTbApp,
}
