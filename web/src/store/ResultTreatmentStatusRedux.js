import differenceInMinutes from 'date-fns/differenceInMinutes'
import Immutable from 'immutable'
import reduce from 'lodash/reduce'
import sortBy from 'lodash/sortBy'
import { defineMessages } from 'react-intl'
import { filterFieldsRejectedError, errorPleaseTryAgainInAFewMinutes } from '../utils/error/CommonErrorNotifications'
import { aspectFetch } from '../utils/utils/fetch'

export const types = {
  REQUEST_TREATMENT_STATUSES: 'REQUEST_TREATMENT_STATUSES',
  RECEIVE_TREATMENT_STATUSES: 'RECEIVE_TREATMENT_STATUSES',
}

/*
 * ---------------- Action Creators -----------------
 */

function createRequestTreatmentStatuses() {
  return { type: types.REQUEST_TREATMENT_STATUSES }
}

function createReceiveTreatmentStatuses(items) {
  return {
    type: types.RECEIVE_TREATMENT_STATUSES,
    items,
    lastRefreshed: new Date(),
  }
}

export function fetchTreatmentStatuses() {
  return (dispatch, getState) => {
    const { resultTreatmentStatus: treatmentStatus } = getState()

    if (treatmentStatus.loading) {
      return
    }
    const shouldFetch =
      !treatmentStatus.lastRefreshed ||
      // check every 60 mins in case new option added in db
      differenceInMinutes(new Date(), treatmentStatus.lastRefreshed) > 60
    if (!shouldFetch) {
      return
    }

    dispatch(createRequestTreatmentStatuses())
    return aspectFetch('/result/treatment-status-types', {
      errorNotifications: {
        400: filterFieldsRejectedError(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchTreatmentStatuses.GET.400.title',
              defaultMessage: 'Searching Result Treatment Statuses Failed',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchTreatmentStatuses.GET.default.title',
              defaultMessage: 'Loading Result Treatment Statuses Failed',
            },
          })
        ),
      },
    }).then(json => dispatch(createReceiveTreatmentStatuses(json.data)))
  }
}
/*
 * ---------------- Reducers -----------------
 */
const TreatmentStatus = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  lastRefreshed: undefined,
})

const initialState = new TreatmentStatus()

function requestTreatmentStatuses(state) {
  return state.set('loading', true)
}

function sortTreatmentStatuses(treatmentStatusArr) {
  const sortedTreatmentStatusArr = sortBy(treatmentStatusArr, obj => obj.name)
  const errorStatusArr = []
  const reducedTreatmentArray = reduce(
    sortedTreatmentStatusArr,
    (result, item) => {
      result.push(item)
      if (item.name.toUpperCase() === 'ERROR' || item.name.toUpperCase() === 'FLAGGED') {
        errorStatusArr.push(result.pop())
      }
      return result
    },
    []
  )
  return [...reducedTreatmentArray, ...errorStatusArr]
}

function receiveTreatmentStatuses(state, items, lastRefreshed) {
  const sortedItems = sortTreatmentStatuses(items)
  return state.merge({
    loading: false,
    lastRefreshed,
    items: Immutable.fromJS(sortedItems),
  })
}

export default function treatmentStatusReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_TREATMENT_STATUSES:
      return requestTreatmentStatuses(state)
    case types.RECEIVE_TREATMENT_STATUSES:
      return receiveTreatmentStatuses(state, action.items, action.lastRefreshed)
    default:
      return state
  }
}
