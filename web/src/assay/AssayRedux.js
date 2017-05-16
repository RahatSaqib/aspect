import { defineMessages } from 'react-intl'
import Immutable from 'immutable'
import differenceInMinutes from 'date-fns/difference_in_minutes'
import { aspectFetch } from '../shared/utils/fetch'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes
} from '../error/CommonErrorNotifications'

export const types = {
  REQUEST_ASSAYS: 'REQUEST_ASSAYS',
  RECEIVE_ASSAYS: 'RECEIVE_ASSAYS'
}

/*
 * ---------------- Action Creators -----------------
 */
function createRequestAssays() {
  return { type: types.REQUEST_ASSAYS }
}

function createReceiveAssays(assays) {
  return {
    type: types.RECEIVE_ASSAYS,
    items: assays,
    lastRefreshed: new Date()
  }
}

export function fetchAssays(forceRefresh) {
  return (dispatch, getState) => {
    const { assay } = getState()

    if (assay.loading) {
      return
    }
    const shouldFetch = forceRefresh || !assay.lastRefreshed || (
      differenceInMinutes(new Date(), assay.lastRefreshed) > 5 // five minutes
    )
    if (!shouldFetch) {
      return
    }

    dispatch(createRequestAssays())
    const path = '/assay'
    return aspectFetch(path,
      {
        errorNotifications: {
          400: filterFieldsRejectedError(defineMessages({
            title: {
              id: 'errorResponseMessages.fetchAssays.GET.400.title',
              defaultMessage: 'Searching Assays Failed'
            }
          })),
          default: errorPleaseTryAgainInAFewMinutes(defineMessages({
            title: {
              id: 'errorResponseMessages.fetchAssays.GET.default.title',
              defaultMessage: 'Loading Assays Failed'
            }
          }))
        }
      })
      .then(json => dispatch(createReceiveAssays(json.data)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
export const Assay = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  lastRefreshed: undefined
})

const initialState = new Assay()

function requestAssays(state) {
  return state.set('loading', true)
}

function receiveAssays(state, assays, lastRefreshed) {
  return state.merge({
    loading: false,
    lastRefreshed,
    items: new Immutable.fromJS(assays)
  })
}

export default function assayReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_ASSAYS:
      return requestAssays(state)
    case types.RECEIVE_ASSAYS:
      return receiveAssays(state, action.items, action.lastRefreshed)
    default:
      return state
  }
}
