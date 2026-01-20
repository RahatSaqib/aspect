import { stringify } from 'querystring'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import { DEVICE_MAINTENANCE_STATUS_BY_PERIOD } from '../components/QueryFetch/Device'
import { getDateObject } from '../oldComponents/shared/DateTimeInput/utils/date'
import { getFilters } from '../oldComponents/utils'
import { filterFieldsRejectedError, errorPleaseTryAgainInAFewMinutes } from '../utils/error/CommonErrorNotifications'
import { receiveItem, Items } from '../utils/metaReducers/items'
import { requestTable, receiveTableItems, Table } from '../utils/metaReducers/table'
import { aspectFetch } from '../utils/utils/fetch'
import { downloadFile } from '../utils/utils/files'

const types = {
  REQUEST_DEVICES: 'REQUEST_DEVICES',
  RECEIVE_DEVICES: 'RECEIVE_DEVICES',
  REJECTED_DEVICES: 'REJECTED_DEVICES',
  REQUEST_SINGLE_DEVICE: 'REQUEST_SINGLE_DEVICE',
  RECEIVE_SINGLE_DEVICE: 'RECEIVE_SINGLE_DEVICE',

  REQUEST_UPDATING_SINGLE_DEVICE: 'REQUEST_UPDATING_SINGLE_DEVICE',
  RECEIVE_UPDATED_SINGLE_DEVICE: 'RECEIVE_UPDATED_SINGLE_DEVICE',

  REQUEST_DEVICES_FOR_PERFORMANCE_REPORT: 'REQUEST_DEVICES_FOR_PERFORMANCE_REPORT',
  RECEIVE_DEVICES_FOR_PERFORMANCE_REPORT: 'RECEIVE_DEVICES_FOR_PERFORMANCE_REPORT',

  DEVICE_MAINTENANCE_FORM_SHOW: 'DEVICE_MAINTENANCE_FORM_SHOW',
  DEVICE_MAINTENANCE_FORM_HIDE: 'DEVICE_MAINTENANCE_FORM_HIDE',
}
/*
 * ---------------- Action Creators -----------------
 */
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
  return () => {
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
                id: 'errorResponseMessages.store.exportResults.GET.400.title',
                defaultMessage: 'Exporting DeviceLog Failed',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.device.exportResults.GET.default.title',
                defaultMessage: 'Exporting Device Log Failed',
              },
            })
          ),
        },
      }
    ).then(async elem => {
      const file = await elem.blob
      downloadFile(file, reportName, fileFormat)
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

export function updateDeviceMaintenanceStatus({ externalId, device, notes, expectedBackOnline }) {
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
        expectedBackOnline,
      }),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes({
          ...i18nErrorTitleDescriptor(externalId),
          onClose: () => dispatch(showDialog('maintenance', device)),
        }),
        ...DEVICE_MAINTENANCE_STATUS_BY_PERIOD.ERRORS,
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
