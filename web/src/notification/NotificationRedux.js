import { defineMessages } from 'react-intl'
import Immutable from 'immutable'
import { stringify } from 'querystring'

import { aspectFetch } from '../shared/utils/fetch'
import { nonEmptyFilterValue } from '../filter/utils'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
} from '../error/CommonErrorNotifications'
import { receiveList, Items } from '../shared/metaReducers/items'
import {
  requestTable,
  receiveTableItems,
  Table,
} from '../shared/metaReducers/table'

export const types = {
  REQUEST_NOTIFICATIONS: 'REQUEST_NOTIFICATIONS',
  RECEIVE_NOTIFICATIONS: 'RECEIVE_NOTIFICATIONS',
}
//

/*
 * ---------------- Action Creators -----------------
 */
function requestNotifications(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_NOTIFICATIONS,
    sortCol,
    sortDir,
    page,
    size,
    filters,
  }
}

function receiveNotifications(json) {
  return {
    type: types.RECEIVE_NOTIFICATIONS,
    items: json.data,
    total: json.total,
  }
}

// With state.filter.listFilter & extraFilters
export function fetchListFilteredNotifications(extraFilters = {}, ...args) {
  return (dispatch, getState) => {
    const filters = getState().filter.listFilter
      .toMap()
      .merge(extraFilters)
      .filter(nonEmptyFilterValue)
      .toJS()

    return dispatch(fetchNotifications(filters, ...args))
  }
}

export function fetchNotifications(
  filters /* required */,
  sortCol = 'name',
  sortDir = 'asc',
  page = 0,
  pageSize = 10
) {
  return dispatch => {
    dispatch(requestNotifications(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(
      `/notification?${stringify({
        sortCol,
        sortDir,
        page,
        size: pageSize,
        ...filters,
      })}`,
      {
        errorNotifications: {
          400: filterFieldsRejectedError(
            defineMessages({
              title: {
                id: 'errorResponseMessages.fetchNotifications.GET.400.title',
                defaultMessage: 'Searching Notifications Failed',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.fetchNotifications.GET.default.title',
                defaultMessage: 'Loading Notifications Failed',
              },
            })
          ),
        },
      }
    ).then(json => dispatch(receiveNotifications(json)))
  }
}
/*
 * ---------------- Reducers -----------------
 */
const Notification = Immutable.Record({
  items: new Items(),
  table: new Table(),
})

const initialState = new Notification()

export default function notificationReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_NOTIFICATIONS:
      return state.set('table', requestTable(state.table, action))
    case types.RECEIVE_NOTIFICATIONS:
      return state.withMutations(mutState => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
    default:
      return state
  }
}
