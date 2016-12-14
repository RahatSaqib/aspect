import Immutable from 'immutable'

import { aspectFetch } from '../shared/utils/fetch'
import { addError } from '../error/ErrorRedux'

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

    return aspectFetch(`/device/${deviceId}`)
      .then(json => dispatch(receiveDemoDevice(json.data)))
      .catch((err) => {
        dispatch(addError(`Loading a device (${deviceId}) failed`, err.message, err))
      })
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
