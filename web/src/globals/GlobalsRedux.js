import Immutable from 'immutable'

export const types = {
  GLOBALS_SET_NAV_TITLE: 'GLOBALS_SET_NAV_TITLE',
  GLOBALS_SET_LAST_SERVER_RESPONSE_TIME:
    'GLOBALS_SET_LAST_SERVER_RESPONSE_TIME',
}

/*
 * ---------------- Action Creators -----------------
 */

export function setLastServerResponseTime(serverTime) {
  return {
    type: types.GLOBALS_SET_LAST_SERVER_RESPONSE_TIME,
    serverTime,
  }
}

export function setNavTitle(title) {
  return {
    type: types.GLOBALS_SET_NAV_TITLE,
    title,
  }
}

/*
 * ---------------- Reducers -----------------
 */
const Globals = Immutable.Record({
  title: undefined,
  lastServerResponseTime: new Date(),
})

const initialState = new Globals()

export default function globalsReducer(state = initialState, action) {
  switch (action.type) {
    case types.GLOBALS_SET_NAV_TITLE:
      return state.set('title', action.title)
    case types.GLOBALS_SET_LAST_SERVER_RESPONSE_TIME:
      return state.set('lastServerResponseTime', action.serverTime)
    default:
      return state
  }
}
