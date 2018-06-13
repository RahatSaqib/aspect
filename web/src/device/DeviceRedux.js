import { stringify } from 'querystring'
import _ from 'lodash'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import differenceInMinutes from 'date-fns/differenceInMinutes'

import { aspectFetch } from '../shared/utils/fetch'
import { mergeToFiltersParams } from '../filter/utils'
import {
  filterFieldsRejectedError,
  errorNotFound,
  errorPleaseTryAgainInAFewMinutes,
  errorInsufficientScope,
} from '../error/CommonErrorNotifications'

import { receiveList, receiveItem, Items } from '../shared/metaReducers/items'
import {
  requestTable,
  receiveTableItems,
  Table,
} from '../shared/metaReducers/table'
import { receivedExportResponse } from '../filter/FilterRedux'

export const types = {
  REQUEST_DEVICES: 'REQUEST_DEVICES',
  RECEIVE_DEVICES: 'RECEIVE_DEVICES',

  REQUEST_SINGLE_DEVICE: 'REQUEST_SINGLE_DEVICE',
  RECEIVE_SINGLE_DEVICE: 'RECEIVE_SINGLE_DEVICE',

  REQUEST_UPDATING_SINGLE_DEVICE: 'REQUEST_UPDATING_SINGLE_DEVICE',
  RECEIVE_UPDATED_SINGLE_DEVICE: 'RECEIVE_UPDATED_SINGLE_DEVICE',

  REQUEST_DEVICES_FOR_SELECT_LIST: 'REQUEST_DEVICES_FOR_SELECT_LIST',
  RECEIVE_DEVICES_FOR_SELECT_LIST: 'RECEIVE_DEVICES_FOR_SELECT_LIST',
}
/*
 * ---------------- Action Creators -----------------
 */
function requestDevices(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_DEVICES,
    sortCol,
    sortDir,
    page,
    size,
    filters,
  }
}

function receiveDevices(json) {
  return {
    type: types.RECEIVE_DEVICES,
    items: json.data,
    total: json.total,
  }
}

export function fetchDevices(
  rawFiltersParams,
  extraFilters = {},
  sortCol,
  sortDir,
  page,
  pageSize
) {
  return dispatch => {
    const filtersParams = mergeToFiltersParams(extraFilters, rawFiltersParams)
    const filters = _.fromPairs([...filtersParams.entries()])
    dispatch(requestDevices(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(
      `/device?${stringify({
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
                id: 'errorResponseMessages.fetchDevices.GET.400.title',
                defaultMessage: 'Searching Devices Failed',
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
                id: 'errorResponseMessages.fetchDevices.GET.default.title',
                defaultMessage: 'Loading Devices Failed',
              },
            })
          ),
        },
      }
    ).then(json => dispatch(receiveDevices(json)))
  }
}

function requestDevicesForSelectList() {
  return {
    type: types.REQUEST_DEVICES_FOR_SELECT_LIST,
  }
}

function receiveDevicesForSelectList(devicesForSelectList) {
  return {
    type: types.RECEIVE_DEVICES_FOR_SELECT_LIST,
    items: devicesForSelectList,
    lastRefreshed: new Date(),
  }
}

export function fetchDevicesForSelectList(forceRefresh, filters) {
  return (dispatch, getState) => {
    const { device } = getState()

    if (device.selectList.loading) {
      return
    }
    const shouldFetch =
      forceRefresh ||
      !device.selectList.lastRefreshed ||
      differenceInMinutes(new Date(), device.selectList.lastRefreshed) > 5
    if (!shouldFetch) {
      return
    }

    dispatch(requestDevicesForSelectList())
    return aspectFetch(`/device/select-list?${stringify(filters)}`, {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.fetchDevicesForSelectList.GET.default.title',
              defaultMessage: 'Loading Devices Failed',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveDevicesForSelectList(json.data)))
  }
}

function requestSingleDevice(requestedAt, deviceId) {
  return {
    type: types.REQUEST_SINGLE_DEVICE,
    requestedAt,
    deviceId,
  }
}

function receiveSingleDevice(requestedAt, item) {
  return {
    type: types.RECEIVE_SINGLE_DEVICE,
    requestedAt,
    item,
  }
}

export function fetchSingleDevice(deviceId, rawFiltersParams) {
  const filtersParams = new URLSearchParams()
  if (rawFiltersParams.has('dateRange')) {
    filtersParams.set('dateRange', rawFiltersParams.get('dateRange'))
  }
  return dispatch => {
    const filters = _.fromPairs([...filtersParams.entries()])
    const requestedAt = Date.now()
    dispatch(requestSingleDevice(requestedAt, deviceId))

    return aspectFetch(`/device/${deviceId}?${stringify(filters)}`, {
      errorNotifications: {
        404: errorNotFound(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchSingleDevice.GET.404.title',
              defaultMessage: 'Could Not Find Device Details',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchSingleDevice.GET.default.title',
              defaultMessage: 'Error Loading Device Details',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveSingleDevice(requestedAt, json.data)))
  }
}

function requestUpdatingSingleDevice(requestedAt, deviceId, data) {
  return {
    type: types.REQUEST_UPDATING_SINGLE_DEVICE,
    requestedAt,
    deviceId,
    data,
  }
}

function receiveUpdatedSingleDevice(requestedAt, item) {
  return {
    type: types.RECEIVE_UPDATED_SINGLE_DEVICE,
    requestedAt,
    item,
  }
}

export function updateSingleDevice(deviceId, data) {
  return dispatch => {
    const requestedAt = Date.now()
    dispatch(requestUpdatingSingleDevice(requestedAt, deviceId, data))

    return aspectFetch(`/device/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.updateSingleDevice.PUT.default.title',
              defaultMessage:
                'An Error Occurred When Trying to Save the Device',
            },
          })
        ),
      },
    }).then(json =>
      dispatch(receiveUpdatedSingleDevice(requestedAt, json.data))
    )
  }
}

export function exportDevices(
  rawFiltersParams,
  extraFilters = {},
  format,
  sortCol,
  sortDir,
  page,
  pageSize
) {
  return dispatch => {
    const filtersParams = mergeToFiltersParams(extraFilters, rawFiltersParams)
    const filters = _.fromPairs([...filtersParams.entries()])

    return aspectFetch(
      `/device/export?${stringify({
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
                id: 'errorResponseMessages.exportDevices.GET.400.title',
                defaultMessage: 'Exporting Devices Failed',
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
                id: 'errorResponseMessages.exportDevices.GET.default.title',
                defaultMessage: 'Exporting Devices Failed',
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

/*
 * ---------------- Reducers -----------------
 */
const SelectListItems = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  lastRefreshed: undefined,
})
const Device = Immutable.Record({
  requestedAt: undefined,
  items: new Items(),
  table: new Table(),
  selectList: new SelectListItems(),
})

const initialState = new Device()

export default function deviceReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_DEVICES:
      return state.withMutations(mutState => {
        mutState.set('requestedAt', action.requestedAt)
        mutState.set('table', requestTable(mutState.table, action))
      })
    case types.RECEIVE_DEVICES:
      return state.withMutations(mutState => {
        mutState.delete('requestedAt')
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
    case types.REQUEST_SINGLE_DEVICE:
    case types.REQUEST_UPDATING_SINGLE_DEVICE:
      return state.set('requestedAt', action.requestedAt)
    case types.RECEIVE_SINGLE_DEVICE:
    case types.RECEIVE_UPDATED_SINGLE_DEVICE:
      return state.withMutations(mutState => {
        mutState.delete('requestedAt')
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
    case types.REQUEST_DEVICES_FOR_SELECT_LIST:
      return state.setIn(['selectList', 'loading'], true)
    case types.RECEIVE_DEVICES_FOR_SELECT_LIST:
      return state.mergeIn(['selectList'], {
        loading: false,
        lastRefreshed: action.lastRefreshed,
        items: new Immutable.fromJS(action.items),
      })
    default:
      return state
  }
}
