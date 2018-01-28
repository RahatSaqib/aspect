import { stringify } from 'querystring'
import _ from 'lodash'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'

import { aspectFetch } from '../shared/utils/fetch'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
  errorInsufficientScope,
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

export function fetchNotifications(
  filtersParams,
  sortCol,
  sortDir,
  page,
  pageSize
) {
  return dispatch => {
    const filters = _.fromPairs([...filtersParams.entries()])
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
          403: errorInsufficientScope(
            defineMessages({
              title: {
                id: 'errorResponseMessages.fetchPersons.GET.403.title',
                defaultMessage: 'Insufficient Permissions',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id:
                  'errorResponseMessages.fetchNotifications.GET.default.title',
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
