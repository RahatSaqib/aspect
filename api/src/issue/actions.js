// ----------- Action Types ---------------------
const types = {
  ISSUE_CREATED: 'ISSUE_CREATED',
  ISSUE_TRIGGERED: 'ISSUE_TRIGGERED',
  ISSUE_ESCALATED: 'ISSUE_ESCALATED',
  ISSUE_ACKNOWLEDGED: 'ISSUE_ACKNOWLEDGED',
  ISSUE_RESOLVED: 'ISSUE_RESOLVED',
  ESCALATE_ISSUES: 'ESCALATE_ISSUES',
  RESOLVE_ISSUES: 'RESOLVE_ISSUES',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify the issue with given id
 * has been created.
 *
 * issueId is required.
 */
function issueCreated(issueId) {
  if (issueId == null) {
    throw new Error('Must specify issueId')
  }
  return {
    type: types.ISSUE_CREATED,
    issueId,
  }
}

/**
 * Creates an action to notify the issue with given id
 * has been triggered. This will be whenever an issue
 * has been triggered whether it is a new or prexisting
 * issue.
 *
 * issueId is required.
 */
function issueTriggered(issueId) {
  if (issueId == null) {
    throw new Error('Must specify issueId')
  }
  return {
    type: types.ISSUE_TRIGGERED,
    issueId,
  }
}

/**
 * Creates an action to notify the issue with given id
 * has been escalated.
 *
 * issueId is required.
 * level is required
 */
function issueEscalated(issueId, level) {
  if (issueId == null) {
    throw new Error('Must specify issueId')
  }
  if (level == null) {
    throw new Error('Must specify level')
  }
  return {
    type: types.ISSUE_ESCALATED,
    issueId,
    level,
  }
}

/**
 * Creates an action to notify the issue with given id
 * has been acknowledged.
 *
 * issueId is required.
 */
function issueAcknowledged(issueId) {
  if (issueId == null) {
    throw new Error('Must specify issueId')
  }
  return {
    type: types.ISSUE_ACKNOWLEDGED,
    issueId,
  }
}

/**
 * Creates an action to notify the issue with given id
 * has been resolved.
 *
 * issueId is required.
 */
function issueResolved(issueId) {
  if (issueId == null) {
    throw new Error('Must specify issueId')
  }
  return {
    type: types.ISSUE_RESOLVED,
    issueId,
  }
}

/**
 * Creates an action to trigger a process that looks up
 * and escalates issues needing escalation.
 *
 * issueId is optional.
 */
function escalateIssues(issueId) {
  return issueId
    ? {
        type: types.ESCALATE_ISSUES,
        issueId,
      }
    : {
        type: types.ESCALATE_ISSUES,
      }
}

/**
 * Creates an action to trigger a process that looks up
 * and escalates issues needing escalation.
 *
 * issueId is optional.
 */
function resolveIssues(issueId) {
  return issueId
    ? {
      type: types.RESOLVE_ISSUES,
      issueId,
    }
    : {
      type: types.RESOLVE_ISSUES,
    }
}

module.exports = {
  types,
  issueCreated,
  issueTriggered,
  issueEscalated,
  issueAcknowledged,
  issueResolved,
  escalateIssues,
  resolveIssues,
}
