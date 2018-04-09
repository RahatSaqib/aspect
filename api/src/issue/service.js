const { issueCreated, issueTriggered, issueResolved } = require('./actions')

function onIssueEventTrigger(issueType) {
  return async (action, { messageContext: context }) => {
    context.bindActionCreators({ issueCreated, issueTriggered })
    return context.transact(async knex => {
      const now = new Date()
      const openIssue = await findOpenIssue(knex, issueType, action)

      let issue = null
      if (openIssue != null) {
        issue = openIssue
      } else {
        issue = await createNewIssue(knex, issueType, action)
        context.issueCreated(issue.id)
      }

      await knex('IssueEvent').insert({
        issueId: issue == null ? null : issue.id,
        issueEventStatusId: await getId(knex, 'IssueEventStatus', 'Triggered'),
        data: JSON.stringify(action),
        createdOn: now,
      })
      context.issueTriggered(issue.id)
    })
  }
}

function onIssueEventResolve(issueType) {
  return async (action, { messageContext: context }) => {
    context.bindActionCreators({ issueResolved })
    context.transact(async knex => {
      const now = new Date()
      const openIssue = await findOpenIssue(knex, issueType, action)

      let issue = null
      if (openIssue != null) {
        issue = openIssue
        await knex('Issue')
          .where({ id: issue.id })
          .update({
            issueStatusId: await getId(knex, 'IssueStatus', 'Resolved'),
          })
        context.issueResolved(issue.id)
        await knex('IssueEvent').insert({
          issueId: issue.id,
          issueEventStatusId: await getId(knex, 'IssueEventStatus', 'Resolved'),
          data: JSON.stringify(action),
          createdOn: now,
        })
      }
    })
  }
}

async function findOpenIssue(knex, issueType, action) {
  const findOpenIssue = knex('Issue as i')
    .join('IssueType as it', 'i.issueTypeId', 'it.id')
    .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .where({ 'it.externalId': issueType })
    .whereNotIn('is.externalId', ['Inactive', 'Resolved'])
    .orderBy('i.updatedOn', 'desc')

  if (action.deviceId) {
    findOpenIssue.where({ 'i.deviceId': action.deviceId })
  } else if (action.siteId) {
    findOpenIssue.where({ 'i.siteId': action.siteId })
  } else if (action.geographyId) {
    findOpenIssue.where({ 'i.geographyId': action.geographyId })
  } else if (action.partnerId) {
    findOpenIssue.where({ 'i.partnerId': action.partnerId })
  }

  return findOpenIssue.first('i.id')
}

async function createNewIssue(knex, issueType, action) {
  const now = new Date()
  const issue = {
    issueStatusId: await getId(knex, 'IssueStatus', 'Active'),
    issueTypeId: await getId(knex, 'IssueType', issueType),
    level: 1,
    createdOn: now,
    updatedOn: now,
  }

  if (action.resultId) {
    issue.resultId = action.resultId
    const issueContext = await knex('Result')
      .where({ id: issue.resultId })
      .first('deviceId', 'siteId', 'geographyId', 'partnerId')
    issue.deviceId = issueContext.deviceId
    issue.siteId = issueContext.siteId
    issue.geographyId = issueContext.geographyId
    issue.partnerId = issueContext.partnerId
  } else if (action.deviceId) {
    issue.deviceId = action.deviceId
    const issueContext = await knex('Device')
      .where({ id: issue.deviceId })
      .first('siteId', 'geographyId', 'partnerId')
    issue.siteId = issueContext.siteId
    issue.geographyId = issueContext.geographyId
    issue.partnerId = issueContext.partnerId
  } else if (action.siteId) {
    issue.siteId = action.siteId
    const issueContext = await knex('Site')
      .where({ id: issue.deviceId })
      .first('geographyId', 'partnerId')
    issue.geographyId = issueContext.geographyId
    issue.partnerId = issueContext.partnerId
  }

  if (action.geographyId) {
    issue.geographyId = action.geographyId
  }

  if (action.partnerId) {
    issue.partnerId = action.partnerId
  }

  const [issueId] = await knex('Issue').insert(issue)
  issue.id = issueId
  return issue
}

async function getId(knex, table, externalId) {
  const { id } = await knex(table)
    .where({ externalId })
    .first('id')
  return id
}

module.exports = {
  onIssueEventTrigger,
  onIssueEventResolve,
}
