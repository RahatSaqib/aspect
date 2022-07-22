import { defineMessages } from 'react-intl'
import Immutable from 'immutable'
import differenceInMinutes from 'date-fns/differenceInMinutes'
import { aspectFetch } from '../shared/utils/fetch'
import { filterFieldsRejectedError, errorPleaseTryAgainInAFewMinutes } from '../error/CommonErrorNotifications'

export const tokens = {
  PROVISIONED: 'provisioned',
  ASSIGNED: 'assigned',
  APPROVED: 'approved',
  DECOMMISSIONED: 'decommissioned',
}

export const types = {
  REQUEST_DEVICE_APPROVALS: 'REQUEST_DEVICE_APPROVALS',
  RECEIVE_DEVICE_APPROVALS: 'RECEIVE_DEVICE_APPROVALS',
}
//
/*
 * ---------------- Action Creators -----------------
 */
function createDeviceApprovals() {
  return { type: types.REQUEST_DEVICE_APPROVALS }
}

function createReceiveDeviceApprovals(items) {
  return {
    type: types.RECEIVE_DEVICE_APPROVALS,
    items,
    lastRefreshed: new Date(),
  }
}

export function fetchDeviceApprovals(forceRefresh) {
  return (dispatch, getState) => {
    const { deviceApproval } = getState()

    if (deviceApproval.loading) {
      return
    }
    const shouldFetch =
      forceRefresh ||
      !deviceApproval.lastRefreshed ||
      // check every 60 mins in case new option added in db
      differenceInMinutes(new Date(), deviceApproval.lastRefreshed) > 60
    if (!shouldFetch) {
      return
    }

    dispatch(createDeviceApprovals())
    return aspectFetch('/device/approval-types', {
      errorNotifications: {
        400: filterFieldsRejectedError(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchDeviceApprovals.GET.400.title',
              defaultMessage: 'Searching Device Approvals Failed',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.fetchDeviceApprovals.GET.default.title',
              defaultMessage: 'Loading Device Approval Statuses Failed',
            },
          })
        ),
      },
    }).then(json => dispatch(createReceiveDeviceApprovals(json.data)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const DeviceApproval = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  lastRefreshed: undefined,
})

const initialState = new DeviceApproval()

function requestDeviceApprovals(state) {
  return state.set('loading', true)
}

function receiveDeviceApprovals(state, items, lastRefreshed) {
  return state.merge({
    loading: false,
    lastRefreshed,
    items: Immutable.fromJS(items),
  })
}

export default function workflowStatusReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_DEVICE_APPROVALS:
      return requestDeviceApprovals(state)
    case types.RECEIVE_DEVICE_APPROVALS:
      return receiveDeviceApprovals(state, action.items, action.lastRefreshed)
    default:
      return state
  }
}
