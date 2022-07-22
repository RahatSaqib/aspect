const _ = require('lodash')

async function getDeliverableTbResult(knex, resultId) {
  return knex('Result as r')
    .join('Assay as a', 'r.assayId', 'a.id')
    .join('ResultWorkflowLog as rwl', 'r.id', `rwl.resultId`)
    .join('ResultWorkflowStatus as rws', 'rwl.resultWorkflowStatusId', `rws.id`)
    .whereIn('a.externalId', [
      'GxMtbRif',
      'GxMtbRifUltra',
      'assayBdMgitAst',
      'assayBdMgitGnd',
      'assayGenericDst',
      'assayGenericCulture',
      'assayLPA',
      'assaySmear',
      'assayTbLamp',
    ])
    .andWhere('r.id', resultId)
    .andWhere('rws.externalId', 'Deliverable')
    .first('r.id', 'r.patientData')
}

async function resultHasIssue(knex, resultId, issueTypeExternalId, issueStatuses) {
  const activeIssues = await knex('Issue as i')
    .join('IssueType as it', 'i.issueTypeId', 'it.id')
    .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .whereNotIn('is.externalId', issueStatuses)
    .andWhere({
      'i.resultId': resultId,
      'it.externalId': issueTypeExternalId,
    })
    .select('i.id')
  return !_.isEmpty(activeIssues)
}

async function resultHasActiveOrResolvedIssue(knex, resultId, issueTypeExternalId) {
  return resultHasIssue(knex, resultId, issueTypeExternalId, ['Inactive'])
}

async function resultHasActiveIssue(knex, resultId, issueTypeExternalId) {
  return resultHasIssue(knex, resultId, issueTypeExternalId, ['Inactive', 'Resolved'])
}

async function shouldSendResultToItis(knex, action) {
  if (action.resultId) {
    const result = await getDeliverableTbResult(knex, action.resultId)
    if (_.isEmpty(result)) {
      return false
    }
    const patientData = JSON.parse(result.patientData || '{}')
    if (!patientData.id && !patientData.tbCaseNumber) {
      return false
    }
    const hasActiveIssues = await resultHasActiveIssue(knex, action.resultId, 'ResultUpdated')
    if (!hasActiveIssues) {
      return true
    }
  }
  return false
}

async function shouldSendResultToPatientAsSms(knex, action) {
  if (action.resultId) {
    const result = await getDeliverableTbResult(knex, action.resultId)
    if (_.isEmpty(result)) {
      return false
    }
    const patientData = JSON.parse(result.patientData || '{}')
    if (!patientData.phone) {
      return false
    }
    const hasActiveIssues = await resultHasActiveOrResolvedIssue(knex, action.resultId, 'ResultUpdatedPatientSms')
    if (!hasActiveIssues) {
      return true
    }
  }
  return false
}

module.exports = {
  shouldSendResultToItis,
  shouldSendResultToPatientAsSms,
}
