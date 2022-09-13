import differenceInMinutes from 'date-fns/differenceInMinutes'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import { filterFieldsRejectedError, errorPleaseTryAgainInAFewMinutes } from '../utils/error/CommonErrorNotifications'
import { aspectFetch } from '../utils/utils/fetch'

export const types = {
  REQUEST_RESULT_CATEGORY_GROUP: 'REQUEST_RESULT_CATEGORY_GROUP',
  RECEIVE_RESULT_CATEGORY_GROUP: 'RECEIVE_RESULT_CATEGORY_GROUP',
}
//
/*
 * ---------------- Action Creators -----------------
 */
function createResultCategoryGroup() {
  return { type: types.REQUEST_RESULT_CATEGORY_GROUP }
}

function createReceiveMaintenanceStatus(items) {
  return {
    type: types.RECEIVE_DEVICE_MAINTENCE_STATUS,
    items,
    lastRefreshed: new Date(),
  }
}

export function fetchResultCategoryGroup(forceRefresh) {
  return (dispatch, getState) => {
    const { resultCategoryGroup } = getState()

    if (resultCategoryGroup.loading) {
      return
    }
    const shouldFetch =
      forceRefresh ||
      !resultCategoryGroup.lastRefreshed ||
      // check every 60 mins in case new option added in db
      differenceInMinutes(new Date(), resultCategoryGroup.lastRefreshed) > 60
    if (!shouldFetch) {
      return
    }

    dispatch(createResultCategoryGroup())
    return aspectFetch('/device/maintenance-statuses', {
      errorNotifications: {
        400: filterFieldsRejectedError(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchResultCategoryGroup.GET.400.title',
              defaultMessage: 'Searching Device Maintenance status Failed',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchResultCategoryGroup.GET.default.title',
              defaultMessage: 'Loading Device Maintenance Status Failed',
            },
          })
        ),
      },
    }).then(json => dispatch(createReceiveMaintenanceStatus(json.data)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const ResultCategoryGroup = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  lastRefreshed: undefined,
})

const initialState = new ResultCategoryGroup()

function requestResultCategoryGroup(state) {
  return state.set('loading', true)
}

function receiveResultCategoryGroup(state, items, lastRefreshed) {
  return state.merge({
    loading: false,
    lastRefreshed,
    items: Immutable.fromJS(items),
  })
}

export default function resultCategoryGroupReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_RESULT_CATEGORY_GROUP:
      return requestResultCategoryGroup(state)
    case types.RECEIVE_RESULT_CATEGORY_GROUP:
      return receiveResultCategoryGroup(state, action.items, action.lastRefreshed)
    default:
      return state
  }
}
