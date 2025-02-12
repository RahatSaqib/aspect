import { getAssignment } from '../hooks/person/usePersonAssignment'

export const adminLevels = {
  NATIONAL: 'national',
}

const types = {
  FETCH_JOB_ASSIGNMENTS: 'FETCH_JOB_ASSIGNMENTS',
  ADD_JOB_ASSIGNMENTS_FOR_CURRENT_USER: 'ADD_JOB_ASSIGNMENTS_FOR_CURRENT_USER',
}

/*
 * ---------------- Action Creators -----------------
 */
function setLoadingStateForCurrentPerson() {
  return { type: types.FETCH_JOB_ASSIGNMENTS }
}

function addJobAssignmentForCurrentPerson(jobAssignments) {
  return {
    type: types.ADD_JOB_ASSIGNMENTS_FOR_CURRENT_USER,
    jobAssignments,
  }
}

export function fetchJobAssignmentForCurrentPerson(dispatch, personId) {
  if (!personId) {
    return
  }
  dispatch(setLoadingStateForCurrentPerson())
  return getAssignment(personId).then(data => dispatch(addJobAssignmentForCurrentPerson(data)))
}

export const fetchJobAssignments = personId => dispatch => fetchJobAssignmentForCurrentPerson(dispatch, personId)

const evaluateNationalLevelAdmin = jobAssignment => {
  return (
    jobAssignment &&
    !jobAssignment.stateId &&
    !jobAssignment.lgaId &&
    !jobAssignment.assayId &&
    !jobAssignment.assayTypeId &&
    !jobAssignment.deviceTypeId &&
    !jobAssignment.diseaseId &&
    !jobAssignment.siteId
  )
}

/*
 * ---------------- Reducers -----------------
 */

const initialState = {
  isLoading: false,
  jobAssignments: [],
  adminLevel: undefined,
}

export default function jobAssignmentReducer(state = initialState, action) {
  switch (action.type) {
    case types.FETCH_JOB_ASSIGNMENTS:
      return {
        ...state,
        isLoading: true,
      }
    case types.ADD_JOB_ASSIGNMENTS_FOR_CURRENT_USER:
      return {
        ...state,
        isLoading: false,
        jobAssignments: action.jobAssignments,
        adminLevel: action.jobAssignments?.some(evaluateNationalLevelAdmin) ? adminLevels.NATIONAL : undefined,
      }
    default:
      return state
  }
}
