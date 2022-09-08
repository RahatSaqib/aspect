import differenceInMinutes from 'date-fns/differenceInMinutes'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import { filterFieldsRejectedError, errorPleaseTryAgainInAFewMinutes } from '../utils/error/CommonErrorNotifications'
import { aspectFetch } from '../utils/utils/fetch'

export const types = {
  REQUEST_DEVICE_MAINTENCE_STATUS: 'REQUEST_DEVICE_MAINTENCE_STATUS',
  RECEIVE_DEVICE_MAINTENCE_STATUS: 'RECEIVE_DEVICE_MAINTENCE_STATUS',
}
//
/*
 * ---------------- Action Creators -----------------
 */
function createDeviceMaintenanceStatus() {
  return { type: types.REQUEST_DEVICE_MAINTENCE_STATUS }
}

function createReceiveMaintenanceStatus(items) {
  return {
    type: types.RECEIVE_DEVICE_MAINTENCE_STATUS,
    items,
    lastRefreshed: new Date(),
  }
}

export function fetchDeviceMaintenanceStatus(forceRefresh) {
  return (dispatch, getState) => {
    const { deviceMaintenanceStatus } = getState()

    if (deviceMaintenanceStatus.loading) {
      return
    }
    const shouldFetch =
      forceRefresh ||
      !deviceMaintenanceStatus.lastRefreshed ||
      // check every 60 mins in case new option added in db
      differenceInMinutes(new Date(), deviceMaintenanceStatus.lastRefreshed) > 60
    if (!shouldFetch) {
      return
    }

    dispatch(createDeviceMaintenanceStatus())
    return aspectFetch('/device/maintenance-statuses', {
      errorNotifications: {
        400: filterFieldsRejectedError(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchDeviceMaintenanceStatus.GET.400.title',
              defaultMessage: 'Searching Device Maintenance status Failed',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchDeviceMaintenanceStatus.GET.default.title',
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
const DeviceMaintenanceStatus = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  lastRefreshed: undefined,
})

const initialState = new DeviceMaintenanceStatus()

function requestDeviceMaintenanceStatus(state) {
  return state.set('loading', true)
}

function receiveMaintenanceStatus(state, items, lastRefreshed) {
  return state.merge({
    loading: false,
    lastRefreshed,
    items: Immutable.fromJS(items),
  })
}

export default function workflowStatusReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_DEVICE_MAINTENCE_STATUS:
      return requestDeviceMaintenanceStatus(state)
    case types.RECEIVE_DEVICE_MAINTENCE_STATUS:
      return receiveMaintenanceStatus(state, action.items, action.lastRefreshed)
    default:
      return state
  }
}
