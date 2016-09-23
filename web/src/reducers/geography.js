import Immutable from 'immutable'

import types from './../constants/action_types'
import {
  requestSelectList,
  receiveSelectList,
  SelectList
} from './meta/selectList'

//requestGeographicSelectListItems(state, 'country', action)
function requestGeographicSelectList(state, geographicType, action) {
  return state
    .updateIn([geographicType, 'selectList'], selectList => requestSelectList(selectList, action))
}

//receiveGeographicSelectListItems(state, 'country', items)
function receiveGeographicSelectList(state, geographicType, items) {
  return state
    .updateIn([geographicType, 'selectList'], selectList => receiveSelectList(selectList, items))
}

const GeographicType = Immutable.Record({
  selectList: new SelectList()
})

const Geography = Immutable.Record({
  country: new GeographicType(),
  state: new GeographicType(),
  lga: new GeographicType()
})

const initialState = new Geography()

function geography(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_COUNTRIES_FOR_SELECT_LIST:
    return requestGeographicSelectList(state, 'country', action)
  case types.RECEIVE_COUNTRIES_FOR_SELECT_LIST:
    return receiveGeographicSelectList(state, 'country', action.items)
  case types.REQUEST_STATES_FOR_SELECT_LIST:
    return requestGeographicSelectList(state, 'state', action)
  case types.RECEIVE_STATES_FOR_SELECT_LIST:
    return receiveGeographicSelectList(state, 'state', action.items)
  case types.REQUEST_LGAS_FOR_SELECT_LIST:
    return requestGeographicSelectList(state, 'lga', action)
  case types.RECEIVE_LGAS_FOR_SELECT_LIST:
    return receiveGeographicSelectList(state, 'lga', action.items)
  }
  return state
}

export default geography
