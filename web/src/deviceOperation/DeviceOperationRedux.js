import { stringify } from 'querystring'
import _ from 'lodash'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'

import { aspectFetch } from '../shared/utils/fetch'
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
  REQUEST_DEVICE_OPERATIONS: 'REQUEST_DEVICE_OPERATIONS',
  RECEIVE_DEVICE_OPERATIONS: 'RECEIVE_DEVICE_OPERATIONS',
}
/*
 * ---------------- Action Creators -----------------
 */
function requestDeviceOperations(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_DEVICE_OPERATIONS,
    sortCol,
    sortDir,
    page,
    size,
    filters,
  }
}

function receiveDeviceOperations(json) {
  return {
    type: types.RECEIVE_DEVICE_OPERATIONS,
    items: json.data,
    total: json.total,
  }
}

export function fetchDeviceOperations(
  filtersParams,
  sortCol,
  sortDir,
  page,
  pageSize
) {
  return dispatch => {
    const filters = _.fromPairs([...filtersParams.entries()])
    dispatch(requestDeviceOperations(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(
      `/device-operation?${stringify({
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
                id: 'errorResponseMessages.fetchDeviceOperations.GET.400.title',
                defaultMessage: 'Searching DeviceOperations Failed',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id:
                  'errorResponseMessages.fetchDeviceOperations.GET.default.title',
                defaultMessage: 'Loading DeviceOperations Failed',
              },
            })
          ),
        },
      }
    ).then(json => dispatch(receiveDeviceOperations(json)))
  }
}
/*
 * ---------------- Reducers -----------------
 */
const DeviceOperation = Immutable.Record({
  items: new Items(),
  table: new Table({
    sortCol: 'startedOn',
    sortDir: 'desc',
  }),
})

const initialState = new DeviceOperation()

export default function deviceApiKeyReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_DEVICE_OPERATIONS:
      return state.set('table', requestTable(state.table, action))
    case types.RECEIVE_DEVICE_OPERATIONS:
      return state.withMutations(mutState => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
    default:
      return state
  }
}
