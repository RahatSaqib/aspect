import { defineMessages } from 'react-intl'
import Immutable from 'immutable'
import differenceInMinutes from 'date-fns/differenceInMinutes'
import { aspectFetch } from '../shared/utils/fetch'
import { filterFieldsRejectedError, errorPleaseTryAgainInAFewMinutes } from '../error/CommonErrorNotifications'

export const types = {
  REQUEST_DISEASES: 'REQUEST_DISEASES',
  RECEIVE_DISEASES: 'RECEIVE_DISEASES',
}

function createRequestDiseases() {
  return { type: types.REQUEST_DISEASES }
}

function createReceiveDiseases(diseases) {
  return {
    type: types.RECEIVE_DISEASES,
    items: diseases,
    lastRefreshed: new Date(),
  }
}

export function fetchDiseases(forceRefresh) {
  return (dispatch, getState) => {
    const { disease } = getState()

    if (disease.getIn(['diseases', 'loading'])) {
      return
    }
    const shouldFetch =
      forceRefresh ||
      !disease.getIn(['diseases', 'lastRefreshed']) ||
      differenceInMinutes(new Date(), disease.getIn(['diseases', 'lastRefreshed'])) > 5 // five minutes
    if (!shouldFetch) {
      return
    }

    dispatch(createRequestDiseases())
    return aspectFetch('/diseases', {
      errorNotifications: {
        400: filterFieldsRejectedError(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchDiseases.GET.400.title',
              defaultMessage: 'Searching Diseases Failed',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchDiseases.GET.default.title',
              defaultMessage: 'Loading Diseases Failed',
            },
          })
        ),
      },
    }).then(json => dispatch(createReceiveDiseases(json.data)))
  }
}

export const DiseaseItems = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  lastRefreshed: undefined,
})
export const Disease = Immutable.Record({
  diseases: new DiseaseItems(),
})
const initialState = new Disease()

export default function diseaseReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_DISEASES:
      return state.setIn(['diseases', 'loading'], true)
    case types.RECEIVE_DISEASES:
      return state.mergeIn(['diseases'], {
        loading: false,
        lastRefreshed: action.lastRefreshed,
        items: Immutable.fromJS(action.items),
      })
    default:
      return state
  }
}
