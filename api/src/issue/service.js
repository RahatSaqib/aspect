const _ = require('lodash')
const Boom = require('boom')

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
        issue = await mergeActionData(knex, openIssue, action)
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
            updatedOn: now,
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

  return findOpenIssue.first('i.id', 'i.data')
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
    const issueContext = await knex('Device as d')
      .leftJoin('Site as s', 's.id', 'd.siteId')
      .where({ 'd.id': issue.deviceId })
      .first(
        'd.partnerId',
        'd.siteId',
        knex.raw('coalesce(d.geographyId, s.geographyId) as geographyId')
      )
    issue.siteId = issueContext.siteId
    issue.geographyId = issueContext.geographyId
    issue.partnerId = issueContext.partnerId
  } else if (action.siteId) {
    issue.siteId = action.siteId
    const issueContext = await knex('Site')
      .where({ id: issue.siteId })
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

  if (_.get(action, 'options.dueOn') != null) {
    issue.dueOn = new Date(action.options.dueOn)
  }
  issue.data = JSON.stringify(getActionData(action))

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

async function mergeActionData(knex, issue, action) {
  const issueUpdates = {}
  if (_.get(action, 'options.dueOn') != null) {
    issueUpdates.dueOn = new Date(action.options.dueOn)
  }

  const actionData = getActionData(action)
  if (!_.isEmpty(actionData)) {
    const existingData = issue.data == null ? {} : JSON.parse(issue.data)
    issueUpdates.data = JSON.stringify(_.merge(existingData, actionData))
  }

  if (!_.isEmpty(issueUpdates)) {
    issueUpdates.updatedOn = new Date()
    await knex('Issue')
      .where({ id: issue.id })
      .update(issueUpdates)
  }
  return _.merge({}, issue, issueUpdates)
}

function getActionData(action) {
  const actionData = {}
  if (action.options != null) {
    // include any keys in options in issue data that is not recorded elsewhere,
    // with preference to keys in data plain object
    _.merge(
      actionData,
      _.omit(action.options, ['dueOn', 'data']),
      action.options.data
    )
  }
  return actionData
}

async function updateIssueStatus(request) {
  const { auth, params, payload, plugins: { messageContext } } = request
  const now = new Date()
  const { issueId } = params
  const { issueStatusExternalId } = payload
  const { id: currentUserId, personId } = await getUser(auth.credentials.name)
  if (issueStatusExternalId !== 'Acknowledged') {
    throw Boom.badRequest('Can only acknowledge issue from UI')
  }

  messageContext.bindActionCreators({ issueAcknowledged })
  await messageContext.transact(async knex => {
    // only allow acknowledge if issue active and current user
    // is a assigned a notification that can acknowledge
    const notification = await knex('Notification as n')
      .join('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
      .join('Issue as i', 'i.id', 'n.issueId')
      .join('IssueStatus as is', 'is.id', 'i.issueStatusId')
      .where({
        'i.id': issueId,
        'n.personId': personId,
        'nt.canAcknowledge': 1,
        'is.externalId': 'Active',
      })
      .first('n.id')
    if (notification == null) {
      throw Boom.unauthorized('No Active Issue to Acknowledge')
    }

    const issueStatusId = await getId(
      knex,
      'IssueStatus',
      issueStatusExternalId
    )
    await knex('Issue')
      .where({ id: issueId })
      .update({
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
