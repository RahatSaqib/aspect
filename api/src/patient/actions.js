// ----------- Action Types ---------------------
const types = {
  PATIENT_ADDED: 'PATIENT_ADDED',
  PATIENT_UPDATED: 'PATIENT_UPDATED',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify a patient
 * record has been created with the given id
 *
 * patientId is required.
 */
function patientAdded(patientId) {
  if (!patientId) {
    throw new Error('Must specify patientId')
  }
  return {
    type: types.PATIENT_ADDED,
    patientId,
  }
}

/**
 * Creates an action to notify a patient record
 * with given id has been updated.
 *
 * patientId is required.
 */
function patientUpdated(patientId) {
  if (!patientId) {
    throw new Error('Must specify patientId')
  }
  return {
    type: types.PATIENT_UPDATED,
    caseId: patientId,
  }
}

module.exports = {
  types,
  patientAdded,
  patientUpdated,
}
