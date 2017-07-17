import { defineMessages } from 'react-intl'
import Immutable from 'immutable'
import { stringify } from 'querystring'

import { aspectFetch } from '../shared/utils/fetch'
import { nonEmptyFilterValue } from '../filter/utils'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
} from '../error/CommonErrorNotifications'

import { receiveList, receiveItem, Items } from '../shared/metaReducers/items'
import {
  requestTable,
  receiveTableItems,
  Table,
} from '../shared/metaReducers/table'
import { receivedExportResponse } from '../filter/FilterRedux'

export const types = {
  REQUEST_DEVICE_API_KEYS: 'REQUEST_DEVICE_API_KEYS',
  RECEIVE_DEVICE_API_KEYS: 'RECEIVE_DEVICE_API_KEYS',

  REQUEST_UPDATING_SINGLE_DEVICE_API_KEY:
    'REQUEST_UPDATING_SINGLE_DEVICE_API_KEY',
  RECEIVE_UPDATED_SINGLE_DEVICE_API_KEY:
    'RECEIVE_UPDATED_SINGLE_DEVICE_API_KEY',
}
/*
 * ---------------- Action Creators -----------------
 */
function requestDeviceApiKeys(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_DEVICE_API_KEYS,
    sortCol,
    sortDir,
    page,
    size,
    filters,
  }
}

function receiveDeviceApiKeys(json) {
  return {
    type: types.RECEIVE_DEVICE_API_KEYS,
    items: json.data,
    total: json.total,
  }
}

export function fetchDeviceApiKeys(
  sortCol = 'createdOn',
  sortDir = 'desc',
  page = 0,
  pageSize = 10
) {
  return (dispatch, getState) => {
    dispatch(requestDeviceApiKeys(sortCol, sortDir, page, pageSize, filters))

    const filters = getState().filter.listFilter
      .toMap()
      .filter(nonEmptyFilterValue)
      .toJS()

    return aspectFetch(
      `/deviceApiKey?${stringify({
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
                id: 'errorResponseMessages.fetchDeviceApiKeys.GET.400.title',
                defaultMessage: 'Searching DeviceApiKeys Failed',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id:
                  'errorResponseMessages.fetchDeviceApiKeys.GET.default.title',
                defaultMessage: 'Loading DeviceApiKeys Failed',
              },
            })
          ),
        },
      }
    ).then(json => dispatch(receiveDeviceApiKeys(json)))
  }
}

export function exportDeviceApiKeys(format, sortCol, sortDir, page, pageSize) {
  return (dispatch, getState) => {
    const filters = getState().filter.listFilter
      .toMap()
      .filter(nonEmptyFilterValue)
      .toJS()

    return aspectFetch(
      `/deviceApiKey/export?${stringify({
        sortCol,
        sortDir,
        page,
        size: pageSize,
        format,
        ...filters,
      })}`,
      {
        errorNotifications: {
          400: filterFieldsRejectedError(
            defineMessages({
              title: {
                id: 'errorResponseMessages.exportDeviceApiKeys.GET.400.title',
                defaultMessage: 'Exporting DeviceApiKeys Failed',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id:
                  'errorResponseMessages.exportDeviceApiKeys.GET.default.title',
                defaultMessage: 'Exporting DeviceApiKeys Failed',
              },
            })
          ),
        },
      }
    ).then(json => {
      dispatch(receivedExportResponse(format, json))
    })
  }
}

export function generateDeviceApiKeys(data) {
  return () =>
    aspectFetch('/deviceApiKey/generate', {
      method: 'POST',
      body: JSON.stringify(data),
      errorNotifications: {
        400: filterFieldsRejectedError(
          defineMessages({
            title: {
              id: 'errorResponseMessages.generateDeviceApiKeys.POST.400.title',
              defaultMessage: 'Generate DeviceApiKeys Failed',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.generateDeviceApiKeys.POST.default.title',
              defaultMessage: 'Generate DeviceApiKeys Failed',
            },
          })
        ),
      },
    })
}

export function assignDeviceApiKeys(data) {
  return () =>
    aspectFetch('/deviceApiKey/assign', {
      method: 'PUT',
      body: JSON.stringify(data),
      errorNotifications: {
        400: filterFieldsRejectedError(
          defineMessages({
            title: {
              id: 'errorResponseMessages.assignDeviceApiKeys.POST.400.title',
              defaultMessage: 'Assign DeviceApiKeys Failed',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.assignDeviceApiKeys.POST.default.title',
              defaultMessage: 'Assign DeviceApiKeys Failed',
            },
          })
        ),
      },
    })
}

function requestUpdatingSingleDeviceApiKey(deviceApiKeyId, data) {
  return {
    type: types.REQUEST_UPDATING_SINGLE_DEVICE_API_KEY,
    deviceApiKeyId,
    data,
  }
}

function receiveUpdatedSingleDeviceApiKey(item) {
  return {
    type: types.RECEIVE_UPDATED_SINGLE_DEVICE_API_KEY,
    item,
  }
}

export function updateSingleDeviceApiKey(deviceApiKeyId, data) {
  return dispatch => {
    dispatch(requestUpdatingSingleDeviceApiKey(deviceApiKeyId, data))

    return aspectFetch(`/deviceApiKey/${deviceApiKeyId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.updateSingleDeviceApiKey.PUT.default.title',
              defaultMessage:
                'An Error Occurred When Trying to Save the DeviceApiKey',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveUpdatedSingleDeviceApiKey(json.data)))
  }
}
/*
 * ---------------- Reducers -----------------
 */
const DeviceApiKey = Immutable.Record({
  items: new Items(),
  table: new Table({
    sortCol: 'createdOn',
    sortDir: 'desc',
  }),
})

const initialState = new DeviceApiKey()

export default function deviceApiKeyReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_DEVICE_API_KEYS:
      return state.set('table', requestTable(state.table, action))
    case types.RECEIVE_DEVICE_API_KEYS:
      return state.withMutations(mutState => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
    case types.RECEIVE_UPDATED_SINGLE_DEVICE_API_KEY:
      return state.withMutations(mutState => {
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
    default:
      return state
  }
}
