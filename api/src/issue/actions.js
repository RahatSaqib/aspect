// ----------- Action Types ---------------------
const types = {
  ISSUE_CREATED: 'ISSUE_CREATED',
  ISSUE_ESCALATED: 'ISSUE_ESCALATED',
  ISSUE_RESOLVED: 'ISSUE_RESOLVED',
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

module.exports = {
  types,
  issueCreated,
  issueEscalated,
  issueResolved,
}
