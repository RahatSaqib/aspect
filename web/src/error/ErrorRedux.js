import Immutable from 'immutable'

export const types = {
  ADD_ERROR: 'ADD_ERROR',
  REMOVE_ERROR: 'REMOVE_ERROR'
}
/*
 * ---------------- Action Creators -----------------
 */
export function addError(title, desc, obj){
  return {
    type: types.ADD_ERROR,
    title,
    desc,
    obj
  }
}

export function removeError(){
  return {
    type: types.REMOVE_ERROR
  }
}
/*
 * ---------------- Reducers -----------------
 */
// this is a very simple error store right now.
// it will only ever hold one error
// could be easily extended to hold history of errors, dismissable, etc.
// desc is a string, details in a js object that can have any shape
const Error = Immutable.Record({
  hasError: false,
  title: null,
  desc: null,
  obj: null
})

const initialState = new Error()

export default function errorReducer(state = initialState, action) {
  switch (action.type) {
  case types.ADD_ERROR:
    return state.merge({
      hasError: true,
      title: action.title,
      desc: action.desc,
      obj: action.obj
    })
  case types.REMOVE_ERROR:
    return state.clear()
  }
  return state
}
