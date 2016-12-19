import { defineMessages } from 'react-intl'
import Immutable from 'immutable'

import { aspectFetch } from '../shared/utils/fetch'

import {
  errorNotFound,
  errorPleaseTryAgainInAFewMinutes
} from '../error/CommonErrorNotifications'

import {
  receiveItem,
  Items
} from '../shared/metaReducers/items'

export const types = {
  DEMO_REQUEST_DEVICE: 'DEMO_REQUEST_DEVICE',
  DEMO_RECEIVE_DEVICE: 'DEMO_RECEIVE_DEVICE',
  DEMO_POSTING_RESULT: 'DEMO_POSTING_RESULT',
  DEMO_POSTED_RESULT: 'DEMO_POSTED_RESULT'
}

/*
 * ---------------- Action Creators -----------------
 */

function requestDemoDevice(deviceId) {
  return {
    type: types.DEMO_REQUEST_DEVICE,
    deviceId
  }
}

function receiveDemoDevice(item) {
  return {
    type: types.DEMO_RECEIVE_DEVICE,
    item
  }
}

export function fetchDemoDevice(deviceId) {
  return (dispatch) => {
    dispatch(requestDemoDevice(deviceId))

    return aspectFetch(`/demo/device/${deviceId}`,
      {
        errorNotifications: {
          404: errorNotFound(defineMessages({
            title: {
              id: 'errorResponseMessages.fetchSingleDevice.GET.404.title',
              defaultMessage: 'Could Not Find Device Details'
            }
          })),
          default: errorPleaseTryAgainInAFewMinutes(defineMessages({
            title: {
              id: 'errorResponseMessages.fetchSingleDevice.GET.default.title',
              defaultMessage: 'Error Loading Device Details'
            }
          }))
        }
      })
      .then(json => dispatch(receiveDemoDevice(json)))
  }
}

function requestPostingResult(deviceId, data) {
  return {
    type: types.DEMO_POSTING_RESULT,
    deviceId,
    data
  }
}

function receivePostedResult() {
  return {
    type: types.DEMO_POSTED_RESULT
  }
}

export function postDemoDeviceResult(deviceId, data) {
  return (dispatch) => {
    dispatch(requestPostingResult(deviceId, data))

    return aspectFetch(`/demo/device/${deviceId}/result`, {
      method: 'POST',
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(defineMessages({
          title: {
            id: 'errorResponseMessages.updateSingleDevice.PUT.default.title',
            defaultMessage: 'An Error Occurred When Trying to Save the Device'
          }
        }))
      }
    }).then(() => dispatch(receivePostedResult()))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const Demo = Immutable.Record({
  deviceItems: new Items()
})

const initialState = new Demo()

export default function demoReducer(state = initialState, action) {
  switch (action.type) {
    case types.DEMO_RECEIVE_DEVICE:
      return state.withMutations((mutState) => {
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('deviceItems', receiveItem(mutState.deviceItems, immutItem))
      })
    default:
      return state
  }
}
