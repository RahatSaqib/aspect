const {
  issueCreated,
  issueTriggered,
  issueAcknowledged,
  issueResolved,
} = require('./actions')
const { getUser } = require('../auth/service')

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
  const issueStatusId = await getId(knex, 'IssueStatus', 'Active')
  const issue = {
    issueStatusId,
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

  await knex('IssueStatusLog').insert({
    issueId,
    issueStatusId,
    createdOn: now,
    changedOn: now,
  })

  return issue
}

async function updateIssueStatus(request) {
  const { auth, params, payload, plugins: { messageContext } } = request
  const now = new Date()
  const { issueId } = params
  const { issueStatusExternalId } = payload
  const { id: currentUserId } = await getUser(auth.credentials.name)

  messageContext.bindActionCreators({ issueAcknowledged })
  await messageContext.transact(async knex => {
    const issueStatusId = await getId(
      knex,
      'IssueStatus',
      issueStatusExternalId
    )
    await knex('Issue').update({
      issueStatusId,
      updatedOn: now,
    })
    await knex('IssueStatusLog').insert({
      issueId,
      issueStatusId,
      createdOn: now,
      changedOn: now,
      createdBy: currentUserId,
    })
    messageContext.issueAcknowledged(issueId)
  })

  return {
    ok: true,
    data: {
      issueId,
      issueStatusExternalId,
      createdOn: now,
      changedOn: now,
    },
  }
}

async function getId(knex, table, externalId) {
  const { id } = await knex(table)
    .where({ externalId })
    .first('id')
  return id
}

module.exports = {
  updateIssueStatus,
  onIssueEventTrigger,
  onIssueEventResolve,
}
