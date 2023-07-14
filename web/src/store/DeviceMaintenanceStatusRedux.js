import Immutable from 'immutable'

export const types = {
  RECEIVE_DEVICE_MAINTENCE_STATUS: 'RECEIVE_DEVICE_MAINTENCE_STATUS',
}
//
/*
 * ---------------- Action Creators -----------------
 */

/*
 * ---------------- Reducers -----------------
 */
const DeviceMaintenanceStatus = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  lastRefreshed: undefined,
})

const initialState = new DeviceMaintenanceStatus()

function receiveMaintenanceStatus(state, items, lastRefreshed) {
  return state.merge({
    loading: false,
    lastRefreshed,
    items: Immutable.fromJS(items),
  })
}

export default function workflowStatusReducer(state = initialState, action) {
  switch (action.type) {
    case types.RECEIVE_DEVICE_MAINTENCE_STATUS:
      return receiveMaintenanceStatus(state, action.items, action.lastRefreshed)
    default:
      return state
  }
}
