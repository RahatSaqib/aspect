import { aspectFetch } from '../utils/fetch'
import { addError } from './error_creators'
import types from './../constants/action_types'

const geoGraphicTypeActions = {
  country: {
    request_type: types.REQUEST_COUNTRIES_FOR_SELECT_LIST,
    receive_type: types.RECEIVE_COUNTRIES_FOR_SELECT_LIST
  },
  state: {
    request_type: types.REQUEST_STATES_FOR_SELECT_LIST,
    receive_type: types.RECEIVE_STATES_FOR_SELECT_LIST
  },
  lga: {
    request_type: types.REQUEST_LGAS_FOR_SELECT_LIST,
    receive_type: types.RECEIVE_LGAS_FOR_SELECT_LIST
  }
}

function requestGeographicSelectList(geographicType, parentId) {
  return {
    type: geoGraphicTypeActions[geographicType].request_type,
    parentId: parentId
  }
}

function receiveGeographicSelectList(geographicType, items) {
  return {
    type: geoGraphicTypeActions[geographicType].receive_type,
    items: items
  }
}

function fetchGeographicSelectList(geographicType, aspectApiPath, parentId) {
  return dispatch => {
    dispatch(requestGeographicSelectList(geographicType, parentId))
    return aspectFetch(aspectApiPath)
      .then(json => dispatch(receiveGeographicSelectList(geographicType, json.data)))
      .catch(err => {
        dispatch(addError('Loading ' + geographicType + ' list failed', err.message, err))
      })
  }
}

export function fetchCountriesSelectList(){
  return fetchGeographicSelectList('country', '/country/select-list')
}

export function fetchStatesSelectList(countryId){
  return fetchGeographicSelectList('state', `/state/select-list/${countryId}`, countryId)
}

export function fetchLgasSelectList(stateId){
  return fetchGeographicSelectList('lga', `/lga/select-list/${stateId}`, stateId)
}
