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

    return aspectFetch(`/device/${deviceId}`,
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
      .then(json => dispatch(receiveDemoDevice(json.data)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const Demo = Immutable.Record({
  items: new Items()
})

const initialState = new Demo()

export default function demoReducer(state = initialState, action) {
  switch (action.type) {
    case types.DEMO_RECEIVE_DEVICE:
      return state.withMutations((mutState) => {
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
    default:
      return state
  }
}
