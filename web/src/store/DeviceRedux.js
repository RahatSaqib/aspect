import { stringify } from 'querystring'
import differenceInMinutes from 'date-fns/differenceInMinutes'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import { getFilters, mergeToFiltersParams } from '../oldComponents/filter/utils'
import { getDateObject } from '../oldComponents/shared/DateTimeInput/utils/date'
import {
  filterFieldsRejectedError,
  errorNotFound,
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
} from '../utils/error/CommonErrorNotifications'
import { receiveItem, Items } from '../utils/metaReducers/items'
import { requestTable, receiveTableItems, Table } from '../utils/metaReducers/table'
import { aspectFetchFile, aspectFetch } from '../utils/utils/fetch'
import { receivedExportResponse } from './GlobalsRedux'

export const types = {
  REQUEST_DEVICES: 'REQUEST_DEVICES',
  RECEIVE_DEVICES: 'RECEIVE_DEVICES',
  REJECTED_DEVICES: 'REJECTED_DEVICES',
  REQUEST_SINGLE_DEVICE: 'REQUEST_SINGLE_DEVICE',
  RECEIVE_SINGLE_DEVICE: 'RECEIVE_SINGLE_DEVICE',

  REQUEST_UPDATING_SINGLE_DEVICE: 'REQUEST_UPDATING_SINGLE_DEVICE',
  RECEIVE_UPDATED_SINGLE_DEVICE: 'RECEIVE_UPDATED_SINGLE_DEVICE',

  REQUEST_DEVICES_FOR_SELECT_LIST: 'REQUEST_DEVICES_FOR_SELECT_LIST',
  RECEIVE_DEVICES_FOR_SELECT_LIST: 'RECEIVE_DEVICES_FOR_SELECT_LIST',

  REQUEST_DEVICES_FOR_PERFORMANCE_REPORT: 'REQUEST_DEVICES_FOR_PERFORMANCE_REPORT',
  RECEIVE_DEVICES_FOR_PERFORMANCE_REPORT: 'RECEIVE_DEVICES_FOR_PERFORMANCE_REPORT',

  DEVICE_MAINTENANCE_FORM_SHOW: 'DEVICE_MAINTENANCE_FORM_SHOW',
  DEVICE_MAINTENANCE_FORM_HIDE: 'DEVICE_MAINTENANCE_FORM_HIDE',
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

function rejectDevices() {
  return {
    type: types.REJECTED_DEVICES,
  }
}

export function fetchDevices(rawFiltersParams, extraFilters = {}, sortCol, sortDir, page, pageSize) {
  return dispatch => {
    const filtersParams = mergeToFiltersParams(extraFilters, rawFiltersParams)
    const filters = getFilters(filtersParams)
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
          403: errorForbidden(
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
    )
      .then(json => dispatch(receiveDevices(json)))
      .catch(() => dispatch(rejectDevices()))
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
              id: 'errorResponseMessages.fetchDevicesForSelectList.GET.default.title',
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
    const filters = getFilters(filtersParams)
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
    dispatch(requestUpdatingSingleDevice(new Date(), deviceId, data))

    return aspectFetch(`/device/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.updateSingleDevice.PUT.default.title',
              defaultMessage: 'An Error Occurred When Trying to Save the Device',
            },
          })
        ),
      },
    }).then(json =>
      dispatch(
        receiveUpdatedSingleDevice(new Date(), {
          ...json.data,
          id: deviceId,
        })
      )
    )
  }
}
// TODO: IMPORTANT!!! THIS FUNCTION SHOULD BE REMOVED ONCE WE MIGRATE ALL THE EXPORT COMPONENTS. THE MIGRATED VERSION IS AT THE ResultQueries.js FILE
export function exportDeviceLogs(filtersParams, fileFormat, reportName) {
  return dispatch => {
    const filters = getFilters(filtersParams)
    return aspectFetch(
      `/device/exportDeviceLogs?${stringify({
        format: fileFormat,
        ...filters,
      })}`,
      {
        errorNotifications: {
          400: filterFieldsRejectedError(
            defineMessages({
              title: {
                id: 'errorResponseMessages.exportResults.GET.400.title',
                defaultMessage: 'Exporting DeviceLog Failed',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.exportResults.GET.default.title',
                defaultMessage: 'Exporting Device Log Failed',
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
export function exportDevices(
  rawFiltersParams,
  extraFilters = {},
  format,
  sortCol,
  sortDir,
  page,
  pageSize,
  fileFormat,
  reportName
) {
  return dispatch => {
    const filtersParams = mergeToFiltersParams(extraFilters, rawFiltersParams)
    const filters = getFilters(filtersParams)
    return aspectFetchFile(
      `/device/export?${stringify({
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
                id: 'errorResponseMessages.exportDevices.GET.400.title',
                defaultMessage: 'Exporting Devices Failed',
              },
            })
          ),
          403: errorForbidden(
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
    ).then(async elem => {
      const file = await elem.blob
      dispatch(receivedExportResponse(file, fileFormat, reportName))
    })
  }
}

export function showDialog(externalId, data) {
  return dispatch => {
    dispatch({
      type: types.DEVICE_MAINTENANCE_FORM_SHOW,
      externalId,
      data,
    })
  }
}
export function hideDialog() {
  return dispatch => {
    dispatch({
      type: types.DEVICE_MAINTENANCE_FORM_HIDE,
    })
  }
}

export function updateDeviceMaintenanceStatus({ externalId, device, notes }) {
  const deviceId = device.get('id')
  const i18nErrorTitleDescriptor = () =>
    defineMessages({
      title: {
        id: 'errorResponseMessages.updateDeviceMaintenance.maintenance.POST.default.title',
        defaultMessage: 'Setting Maintenance Status Failed',
      },
    })

  return dispatch =>
    aspectFetch(`/device/maintenance-status/${deviceId}`, {
      method: 'POST',
      body: JSON.stringify({
        externalId,
        notes,
      }),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes({
          ...i18nErrorTitleDescriptor(externalId),
          onClose: () => dispatch(showDialog('maintenance', device)),
        }),
      },
    })
      .then(json => {
        dispatch(
          receiveUpdatedSingleDevice(new Date(), {
            ...json.data,
            id: deviceId,
          })
        )
        dispatch(hideDialog())
      })
      .catch(err => {
        dispatch(hideDialog())
        throw err
      })
}

export function updateDeviceMaintenance({ externalId, device, values, requestedAt = new Date() }) {
  const deviceId = device.get('id')
  const i18nErrorTitleDescriptor =
    externalId === 'calibration'
      ? defineMessages({
          title: {
            id: 'errorResponseMessages.updateDeviceMaintenance.calibration.POST.default.title',
            defaultMessage: 'Setting Device Calibration Date Failed',
          },
        })
      : defineMessages({
          title: {
            id: 'errorResponseMessages.updateDeviceMaintenance.warranty.POST.default.title',
            defaultMessage: 'Setting Device Warranty Due Date Failed',
          },
        })
  return dispatch =>
    aspectFetch(`/device/maintenance/${deviceId}`, {
      method: 'POST',
      body: JSON.stringify({
        ...values,
        externalId,
      }),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes({
          ...i18nErrorTitleDescriptor,
          onClose: () => dispatch(showDialog(externalId, values)),
        }),
      },
    })
      .then(json => {
        dispatch(receiveUpdatedSingleDevice(requestedAt, json.data))
        dispatch(hideDialog())
      })
      .catch(err => {
        dispatch(hideDialog())
        throw err
      })
}

export function fetchPerformanceReport(deviceId) {
  return dispatch => {
    dispatch(requestPerformanceReport(deviceId))

    return aspectFetch(`/device/performance/${deviceId}`, {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchPerformanceReport.GET.default.title',
              defaultMessage: 'Error Loading Device profile performance report',
            },
          })
        ),
      },
    }).then(json => dispatch(receivePerformanceReport(json)))
  }
}
function requestPerformanceReport(deviceId) {
  return {
    type: types.REQUEST_DEVICES_FOR_PERFORMANCE_REPORT,
    deviceId,
  }
}

function receivePerformanceReport(data) {
  return {
    type: types.RECEIVE_DEVICES_FOR_PERFORMANCE_REPORT,
    data,
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
  activeDialog: Immutable.Map({
    name: undefined,
    data: undefined,
  }),
  performanceReport: Immutable.Map(),
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

        const nextById = mutState.items.byId.withMutations(mutById => {
          immutList.forEach(item => mutById.setIn([item.get('id')], item))
        })

        const nextCurrentIdList = immutList.map(item => item.get('id'))
        const newItem = mutState.items.set('byId', nextById).set('currentIdList', nextCurrentIdList)

        mutState.set('items', newItem)
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
    case types.REJECTED_DEVICES:
      return state.withMutations(mutState => {
        mutState.set('items', mutState.get('items').clear())
        mutState.set('table', mutState.get('table').clear())
      })
    case types.REQUEST_SINGLE_DEVICE:
    case types.REQUEST_UPDATING_SINGLE_DEVICE:
      return state.set('requestedAt', action.requestedAt)
    case types.RECEIVE_SINGLE_DEVICE:
    case types.RECEIVE_UPDATED_SINGLE_DEVICE:
      return state.withMutations(mutState => {
        mutState.delete('requestedAt')
        const { calibrationDate, warrantyDueDate } = action.item
        if (calibrationDate) {
          action.item.calibrationDate = getDateObject(calibrationDate)
        }
        if (warrantyDueDate) {
          action.item.warrantyDueDate = getDateObject(warrantyDueDate)
        }
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
    case types.REQUEST_DEVICES_FOR_SELECT_LIST:
      return state.setIn(['selectList', 'loading'], true)
    case types.RECEIVE_DEVICES_FOR_SELECT_LIST:
      return state.mergeIn(['selectList'], {
        loading: false,
        lastRefreshed: action.lastRefreshed,
        items: Immutable.fromJS(action.items),
      })
    case types.DEVICE_MAINTENANCE_FORM_SHOW:
      return state.mergeIn(['activeDialog'], {
        name: action.externalId,
        data: action.data,
      })
    case types.DEVICE_MAINTENANCE_FORM_HIDE:
      return state.setIn(['activeDialog', 'name'], undefined)
    case types.RECEIVE_DEVICES_FOR_PERFORMANCE_REPORT:
      return state.withMutations(mutState => {
        mutState.set('performanceReport', Immutable.fromJS(action.data))
      })
    default:
      return state
  }
}
