import { defineMessages } from 'react-intl'
import Immutable from 'immutable'
import differenceInMinutes from 'date-fns/difference_in_minutes'
import { aspectFetch } from '../shared/utils/fetch'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes
} from '../error/CommonErrorNotifications'

export const tokens = {
  APPROVED: 'approved',
  UNAPPROVED: 'unapproved'
}

export const types = {
  REQUEST_DEVICE_STATUSES: 'REQUEST_DEVICE_STATUSES',
  RECEIVE_DEVICE_STATUSES: 'RECEIVE_DEVICE_STATUSES'
}
//
/*
 * ---------------- Action Creators -----------------
 */
function createDeviceStatuses() {
  return { type: types.REQUEST_DEVICE_STATUSES }
}

function createReceiveDeviceStatuses(items) {
  return {
    type: types.RECEIVE_DEVICE_STATUSES,
    items,
    lastRefreshed: new Date()
  }
}

export function fetchDeviceStatuses(forceRefresh) {
  return (dispatch, getState) => {
    const { deviceStatus } = getState()

    if (deviceStatus.loading) {
      return
    }
    const shouldFetch = forceRefresh || !deviceStatus.lastRefreshed || (
      // check every 60 mins in case new option added in db
      differenceInMinutes(new Date(), deviceStatus.lastRefreshed) > 60
    )
    if (!shouldFetch) {
      return
    }

    dispatch(createDeviceStatuses())
    return aspectFetch('/device/status-types',
      {
        errorNotifications: {
          400: filterFieldsRejectedError(defineMessages({
            title: {
              id: 'errorResponseMessages.fetchDeviceStatuses.GET.400.title',
              defaultMessage: 'Searching Device Statuses Failed'
            }
          })),
          default: errorPleaseTryAgainInAFewMinutes(defineMessages({
            title: {
              id: 'errorResponseMessages.fetchDeviceStatuses.GET.default.title',
              defaultMessage: 'Loading Device Statuses Failed'
            }
          }))
        }
      })
      .then(json => dispatch(createReceiveDeviceStatuses(json.data)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const DeviceStatus = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  lastRefreshed: undefined
})

const initialState = new DeviceStatus()

function requestDeviceStatuses(state) {
  return state.set('loading', true)
}

function receiveDeviceStatuses(state, items, lastRefreshed) {
  return state.merge({
    loading: false,
    lastRefreshed,
    items: new Immutable.fromJS(items)
  })
}

export default function workflowStatusReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_DEVICE_STATUSES:
      return requestDeviceStatuses(state)
    case types.RECEIVE_DEVICE_STATUSES:
      return receiveDeviceStatuses(state, action.items, action.lastRefreshed)
    default:
      return state
  }
}
