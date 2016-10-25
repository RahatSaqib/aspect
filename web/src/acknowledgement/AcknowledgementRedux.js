import Immutable from 'immutable'

export const types = {
  ADD_ACKNOWLEDGEMENT: 'ADD_ACKNOWLEDGEMENT',
  REMOVE_ACKNOWLEDGEMENT: 'REMOVE_ACKNOWLEDGEMENT'
}

/*
 * ---------------- Action Creators -----------------
 */
export function addAcknowledgement(message) {
  return dispatch => {
    dispatch({
      type: types.ADD_ACKNOWLEDGEMENT,
      acknowledgement: {message}
    })
  }
}

export function removeAcknowledgement(){
  return dispatch => {
    dispatch({
      type: types.REMOVE_ACKNOWLEDGEMENT
    })
  }
}

/*
 * ---------------- Reducers -----------------
 */
const Acknowledgement = Immutable.Record({
  hasAcknowledgement: false,
  message: null
})

const initialState = new Acknowledgement()

export default function acknowledgementReducer(state = initialState, action) {
  switch (action.type) {
  case types.ADD_ACKNOWLEDGEMENT:
    return state.merge({
      hasAcknowledgement: true,
      ...action.acknowledgement
    })
  case types.REMOVE_ACKNOWLEDGEMENT:
    return state.clear()
  }
  return state
}
