import Immutable from 'immutable'

export const types = {
  ADD_ACKNOWLEDGEMENT: 'ADD_ACKNOWLEDGEMENT',
  REMOVE_ACKNOWLEDGEMENT: 'REMOVE_ACKNOWLEDGEMENT'
}
/*
 * ---------------- Action Creators -----------------
 */
export function addAcknowledgement(title, desc){
  return {
    type: types.ADD_ACKNOWLEDGEMENT,
    message: { title: title, desc: desc }
  }
}

export function removeAcknowledgement(){
  return {
    type: types.REMOVE_ACKNOWLEDGEMENT
  }
}
/*
 * ---------------- Reducers -----------------
 */
const Acknowledgement = Immutable.Record({
  hasAcknowledgement: false,
  title: null,
  desc: null
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
