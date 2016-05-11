import types from './../constants/action_types'

export function addError(title, desc, obj){
  return {
    type: types.ADD_ERROR,
    error: { title: title, desc: desc, obj: obj }
  }
}

export function removeError(){
  return {
    type: types.REMOVE_ERROR
  }
}
