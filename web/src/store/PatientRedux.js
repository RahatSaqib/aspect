import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
} from '../utils/error/CommonErrorNotifications'
import { aspectFetch } from '../utils/utils/fetch'

export const PatientResults = Immutable.Record({
  items: Immutable.List(),
})
export const types = {
  RECEIVE_PATIENT_RESULTS: 'RECEIVE_PATIENT_RESULTS',
}
export function fetchResultsByPatient(patientId) {
  return dispatch =>
    aspectFetch(`/result/patientresultsdetails?patientId=${patientId}`, {
      errorNotifications: {
        400: filterFieldsRejectedError(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchPatientResult.GET.400.title',
              defaultMessage: 'Searching Patient Result Failed',
            },
          })
        ),
        403: errorForbidden(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchPatientDetails.GET.403.title',
              defaultMessage: 'Insufficient Permissions',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchPatientDetails.GET.default.title',
              defaultMessage: 'Loading Patient results details Failed',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveResultsByPatient(json)))
}

function receiveResultsByPatient(json) {
  return {
    type: types.RECEIVE_PATIENT_RESULTS,
    data: json.data,
    total: json.total,
  }
}

const initialState = new PatientResults()

export default function patientReducer(state = initialState, action) {
  switch (action.type) {
    case types.RECEIVE_PATIENT_RESULTS:
      return state.withMutations(mutState => {
        mutState.set('items', Immutable.fromJS(action.data))
      })
    default:
      return state
  }
}
