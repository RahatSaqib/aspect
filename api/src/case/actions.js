// ----------- Action Types ---------------------
const types = {
  CASE_ADDED: 'CASE_ADDED',
  CASE_UPDATED: 'CASE_UPDATED',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify the Case
 * has been created with the given id
 *
 * caseId is required.
 */
function caseAdded(caseId) {
  if (!caseId) {
    throw new Error('Must specify caseId')
  }
  return {
    type: types.CASE_ADDED,
    caseId,
  }
}

/**
 * Creates an action to notify the Case with given id
 * has been updated.
 *
 * caseId is required.
 */
function caseUpdated(caseId) {
  if (!caseId) {
    throw new Error('Must specify caseId')
  }
  return {
    type: types.CASE_UPDATED,
    caseId,
  }
}

module.exports = {
  caseAdded,
  caseUpdated,
  types,
}
