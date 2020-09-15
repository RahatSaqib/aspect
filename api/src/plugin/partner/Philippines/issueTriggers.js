const _ = require('lodash')

async function shouldSendResultToItis(knex, action) {
  if (action.resultId) {
    const result = await knex('Result as r')
      .join('Assay as a', 'r.assayId', 'a.id')
      .join('ResultWorkflowLog as rwl', 'r.resultWorkflowStatusLogId', `rwl.id`)
      .join(
        'ResultWorkflowStatus as rws',
        'rwl.resultWorkflowStatusId',
        `rws.id`
      )
      .whereIn('a.externalId', [
        'GxMtbRif',
        'GxMtbRifUltra',
        'assayBdMgitAst',
        'assayBdMgitGnd',
        'assayGenericDst',
        'assayGenericCulture',
        'assayLPA',
        'assaySmear',
      ])
      .andWhere('r.id', action.resultId)
      .andWhere(queryBuilder => {
        queryBuilder.whereIn('rws.externalId', [
          'Error',
          'Validated',
          'Deliverable',
          'Delivered',
          'Acknowledged',
          'Flagged',
        ])
      })
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
  shouldSendResultToItis,
}
