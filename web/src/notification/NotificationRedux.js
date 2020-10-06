import { stringify } from 'querystring'
import fromPairs from 'lodash/fromPairs'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'

import { aspectFetch } from '../shared/utils/fetch'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
} from '../error/CommonErrorNotifications'
import { receiveList, Items } from '../shared/metaReducers/items'
import {
  requestTable,
  receiveTableItems,
  Table,
} from '../shared/metaReducers/table'
import { receivedExportResponse } from '../globals/GlobalsRedux'

export const types = {
  REQUEST_NOTIFICATIONS: 'REQUEST_NOTIFICATIONS',
  RECEIVE_NOTIFICATIONS: 'RECEIVE_NOTIFICATIONS',
  REJECTED_NOTIFICATIONS: 'REJECTED_NOTIFICATIONS',
}

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

function rejectNotifications() {
  return {
    type: types.REJECTED_NOTIFICATIONS,
  }
}

export function exportNotifications(
  filtersParams,
  sortCol,
  sortDir,
  page,
  pageSize,
  fileFormat,
  reportName
) {
  return dispatch => {
    const filters = fromPairs([...filtersParams.entries()])

    return aspectFetch(
      `/notification/export?${stringify({
        sortCol,
        sortDir,
        page,
        size: pageSize,
        format: fileFormat,
        ...filters,
      })}`,
      {
        errorNotifications: {
          400: filterFieldsRejectedError(
            defineMessages({
              title: {
                id: 'errorResponseMessages.exportNotification.GET.400.title',
                defaultMessage: 'Exporting Notification Failed',
              },
            })
          ),
          403: errorForbidden(
            defineMessages({
              title: {
                id: 'errorResponseMessages.exportNotification.GET.403.title',
                defaultMessage: 'Insufficient Permissions',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id:
                  'errorResponseMessages.exportNotifications.GET.default.title',
                defaultMessage: 'Exporting Notifications Failed',
              },
            })
          ),
        },
      }
    ).then(async elem => {
      const file = await elem.blob
      dispatch(receivedExportResponse(file, fileFormat, reportName))
    })
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
    case types.REJECTED_NOTIFICATIONS:
      return state.withMutations(mutState => {
        mutState.set('items', mutState.get('items').clear())
        mutState.set('table', mutState.get('table').clear())
      })
    default:
      return state
  }
}
