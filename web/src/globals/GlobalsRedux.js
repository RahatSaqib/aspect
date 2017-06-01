import Immutable from 'immutable'

export const types = {
  GLOBALS_SET_NAV_TITLE: 'GLOBALS_SET_NAV_TITLE',
}

/*
 * ---------------- Action Creators -----------------
 */

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
})

const initialState = new Globals()

export default function globalsReducer(state = initialState, action) {
  switch (action.type) {
    case types.GLOBALS_SET_NAV_TITLE:
      return state.set('title', action.title)
    default:
      return state
  }
}
