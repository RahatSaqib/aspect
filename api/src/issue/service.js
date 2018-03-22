const { issueCreated, issueEscalated, issueResolved } = require('./actions')

function onIssueTriggered(issueType) {
  return async (action, context) => {
    context.bindActionCreators({ issueCreated, issueEscalated, issueResolved })
    return context.transact(async knex => {
      const now = new Date()
      const openIssue = await findOpenIssue(knex, issueType, action)

      let issue = null
      if (openIssue != null) {
        issue = openIssue
      } else {
        issue = createNewIssue(knex, issueType, action)
        context.issueCreated(issue.id)
      }

      await knex('IssueEvent').insert({
        issueId: issue == null ? null : issue.id,
        issueEventStatusId: await getEventStatusId(knex, 'Triggered'),
        data: JSON.stringify(action),
        createdOn: now,
      })
    })
  }
}

function onIssueResolved(issueType) {
  return async (action, context) => {
    context.bindActionCreators({ issueCreated, issueEscalated, issueResolved })
    context.transact(async knex => {
      const now = new Date()
      const openIssue = await findOpenIssue(knex, issueType, action)

      let issue = null
      if (openIssue != null) {
        await resolveOpenIssue(knex, openIssue.id)
        issue = openIssue
        context.issueResolved(openIssue.id)
      }

      await knex('IssueEvent').insert({
        issueId: issue == null ? null : issue.id,
        issueEventStatusId: await getEventStatusId(knex, 'Resolved'),
        data: JSON.stringify(action),
        createdOn: now,
      })
    })
  }
}

async function findOpenIssue(knex, issueType, action) {
  const findOpenIssue = knex('Issue as i')
    .join('IssueType as it', 'i.issueTypeId', 'it.id')
    .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .where({ 'it.externalId': issueType })
    .whereNotIn('is.externalId', ['Inactive', 'Resolved'])
    .orderBy('updatedOn', 'desc')

  if (action.deviceId) {
    findOpenIssue.join('Device as d', 'i.deviceId', 'd.id')
  } else if (action.siteId) {
    findOpenIssue.join('Site as s', 'i.siteId', 's.id')
  } else if (action.geographyId) {
    findOpenIssue.join('Geography as g', 'g.geographyId', 'g.id')
  } else if (action.partnerId) {
    findOpenIssue.join('Partner as p', 'i.partnerId', 'p.id')
  }

  return findOpenIssue.first('i.id', 'it.id as issueTypeId')
}

async function createNewIssue(knex, issueType, action) {
  // TODO name/description, etc.
  const now = new Date()
  const issue = {
    issueStatusId: await getIssueStatusId(knex, 'Active'),
    issueTypeId: await getIssueTypeId(knex, issueType),
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

  const [issueId] = knex('Issue').insert(issue)
  issue.id = issueId
  return issue
}

async function resolveOpenIssue(knex, issueId) {
  await knex('Issue')
    .where({ id: issueId })
    .update({ issueStatusId: getIssueStatusId('Resolved') })
}

async function getIssueStatusId(knex, externalId) {
  const { id } = await knex('IssueStatus')
    .where({ externalId })
    .first('id')
  return id
}

async function getIssueTypeId(knex, externalId) {
  const { id } = await knex('IssueType')
    .where({ externalId })
    .first('id')
  return id
}

async function getEventStatusId(knex, externalId) {
  const { id } = await knex('IssueEventStatus')
    .where({ externalId })
    .first('id')
  return id
}

module.exports = {
  onIssueTriggered,
  onIssueResolved,
}
