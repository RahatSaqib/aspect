const _ = require('lodash')
const Promise = require('bluebird')
const { loadPlugin } = require('../../plugin/loadPlugin')
const { parseDateOrDefault } = require('../../shared/date')
const { issueTypeToId, issueStatusToId, issueEventStatusToId } = require('../../shared/dictionary')

const nonActiveStatuses = ['Inactive', 'Resolved']
function getActionData(action) {
  const actionData = {}
  if (action.options != null) {
    // include any keys in options in issue data that is not recorded elsewhere,
    // with preference to keys in data plain object
    _.merge(actionData, _.omit(action.options, ['dueOn', 'data']), action.options.data)
  }
  return actionData
}

async function hasIssueEventTrigger(knex, { partnerId, issueType, issueEventStatus, action }) {
  const issueTypeId = await issueTypeToId(issueType)
  const issueEventStatusId = await issueEventStatusToId(issueEventStatus)
  const issueEventTrigger = await knex('IssueEventTrigger')
    .where({ partnerId, issueTypeId, issueEventStatusId })
    .first('triggerConditions')
  if (issueEventTrigger == null) {
    return false
  }
  const conditions = JSON.parse(issueEventTrigger.triggerConditions)
  return conditions.action === action.type
}

async function getIssueFilter(knex, partnerId, deviceId) {
  let partnerPluginName
  let deviceTypePluginName
  if (partnerId) {
    ;({ partnerPluginName } = await knex('Partner').where({ id: partnerId }).first('plugin'))
  } else if (deviceId) {
    ;({ deviceTypePluginName } = await knex('Device as d')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .where({ 'd.id': deviceId })
      .first('dt.plugin'))
  }
  return loadPlugin(partnerPluginName, deviceTypePluginName, 'filtersOpenIssues')
}

async function findOpenIssue(knex, issueType, action, filterIssueCondition = {}) {
  const skipFindingOpenIssue = _.get(filterIssueCondition, 'skipFindingOpenIssue')
  if (skipFindingOpenIssue) return null
  const evaluationFunction = _.get(filterIssueCondition, 'evaluationFunction')
  const findOpenIssue = knex('Issue as i')
    .join('IssueType as it', 'i.issueTypeId', 'it.id')
    .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .where({ 'it.externalId': issueType })
    .whereNotIn('is.externalId', nonActiveStatuses)
    .orderBy('i.updatedOn', 'desc')

  if (action.deviceId) {
    findOpenIssue.where({ 'i.deviceId': action.deviceId })
  } else if (action.resultId) {
    findOpenIssue.where({ 'i.resultId': action.resultId })
  } else if (action.siteId) {
    findOpenIssue.where({ 'i.siteId': action.siteId })
  } else if (action.geographyId) {
    findOpenIssue.where({ 'i.geographyId': action.geographyId })
  } else if (action.partnerId) {
    findOpenIssue.where({ 'i.partnerId': action.partnerId })
  }

  if (_.get(action, 'options.data') && evaluationFunction) {
    const filterFunctions = await getIssueFilter(knex, action.partnerId, action.deviceId)
    if (filterFunctions[evaluationFunction])
      findOpenIssue.modify(filterFunctions[evaluationFunction], action.options.data)
  }
  return findOpenIssue.first('i.id', 'i.partnerId', 'i.data')
}

async function findOpenModuleDisabledIssues(knex, deviceId, moduleSerial) {
  const findOpenIssuesQuery = knex('Issue as i')
    .join('IssueType as it', 'i.issueTypeId', 'it.id')
    .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .join('Device as d', 'i.deviceId', 'd.id')
    .where('d.id', deviceId)
    .where('it.externalId', 'ModuleDisabled')
    .whereNotIn('is.externalId', nonActiveStatuses)
    .whereRaw("JSON_EXTRACT(i.data, '$.moduleSerial') = ?", [moduleSerial])
    .select('i.id', 'i.data')
  return findOpenIssuesQuery
}

async function findOpenIssues(knex, issueType, modifiers) {
  const findOpenIssuesQuery = knex('Issue as i')
    .join('IssueType as it', 'i.issueTypeId', 'it.id')
    .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .where({ 'it.externalId': issueType })
    .whereNotIn('is.externalId', nonActiveStatuses)
    .modify(modifiers)
    .select('i.id', 'i.partnerId', 'i.data')
  return findOpenIssuesQuery
}

async function createNewIssue(knex, issueType, action) {
  const now = new Date()
  const issueTypeId = await issueTypeToId(issueType)
  if (issueTypeId == null) {
    // Issue not configured for this deployment
    return null
  }
  let issueStatusId = await issueStatusToId('Active')

  // Resolve offline issues because the scheduler handles the escalation
  if (action.type === 'DEVICE_OFFLINE') {
    issueStatusId = await issueStatusToId('Resolved')
  }
  const { consumableId = null } = action

  const issueContext = await lookupIssueContext(action, knex)

  // Check if device has a valid site
  if (action.deviceId) {
    const deviceSite = await knex('Device as d')
      .join('Site as s', 'd.siteId', 's.id')
      .where('d.id', action.deviceId)
      .first('s.id')

    if (!deviceSite) {
      // Skip creating issue if device has no valid site
      return null
    }
  }

  const issue = {
    issueStatusId,
    issueTypeId,
    consumableId,
    level: 1,
    createdOn: now,
    updatedOn: now,
    ..._.pick(issueContext, ['deviceId', 'siteId', 'geographyId', 'partnerId']),
    ..._.pick(action, ['resultId', 'deviceId', 'siteId', 'geographyId', 'partnerId']),
  }
  // Now that we know partnerId, check to see if we have a trigger
  const hasTrigger =
    issue != null &&
    issue.partnerId &&
    (await hasIssueEventTrigger(knex, {
      partnerId: issue.partnerId,
      issueType,
      action,
      issueEventStatus: 'Triggered',
    }))
  if (!hasTrigger) {
    return null
  }

  // populate remaining fields
  if (_.get(action, 'options.dueOn') != null) {
    issue.dueOn = parseDateOrDefault(action.options.dueOn)
  }
  issue.data = JSON.stringify(getActionData(action))

  // Everything is fine, create new issue
  const [issueId] = await knex('Issue').insert(issue)
  issue.id = issueId
  issue.issueTypeId = issueTypeId

  await knex('IssueStatusLog').insert({
    issueId,
    issueStatusId,
    createdOn: now,
    changedOn: now,
  })

  return issue
}

async function lookupIssueContext({ resultId, deviceId, siteId, consumableId }, knex) {
  if (resultId) {
    return knex('Result as r')
      .join('Site as s', 'r.siteId', 's.id')
      .where('r.id', resultId)
      .first('r.deviceId', 'r.siteId', 's.geographyId', 'r.partnerId')
  }
  if (deviceId) {
    return knex('Device as d')
      .leftJoin('Site as s', 's.id', 'd.siteId')
      .where({ 'd.id': deviceId })
      .first('d.partnerId', 'd.siteId', 's.geographyId')
  }
  if (siteId) {
    if (consumableId != null) {
      return knex('InventoryItem as ii')
        .innerJoin('Site as s', 'ii.siteId', 's.id')
        .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
        .leftJoin('PartnerConsumable as pc', function () {
          this.on('pc.consumableId', 'c.id').andOn('pc.partnerId', 's.partnerId')
        })
        .where('s.id', siteId)
        .andWhere('ii.consumableId', consumableId)
        .first('s.geographyId', knex.raw('COALESCE(pc.partnerId, s.partnerId) as partnerId'))
    }
    return knex('Site').where({ id: siteId }).first('geographyId', 'partnerId')
  }
  return Promise.resolve({})
}

module.exports = {
  findOpenIssue,
  findOpenIssues,
  createNewIssue,
  getActionData,
  hasIssueEventTrigger,
  findOpenModuleDisabledIssues,
}
