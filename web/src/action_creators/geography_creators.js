import { aspectFetch } from '../utils/fetch'
import { addError } from './error_creators'
import types from './../constants/action_types'

function requestCountriesForLocationSelector() {
  return { type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR }
}

function receiveCountriesForLocationSelector(countries) {
  return {
    type:  types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
    countries: countries,
    lastRefreshed: new Date()
  }
}

function requestStatesForLocationSelector(selectedCountryId) {
  return {
    type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
    selectedCountryId: selectedCountryId
  }
}

function receiveStatesForLocationSelector(states, selectedCountryId) {
  return {
    type:  types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
    states: states,
    selectedCountryId: selectedCountryId,
    lastRefreshed: new Date()
  }
}

function requestLgasForLocationSelector(selectedCountryId, selectedStateId) {
  return {
    type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
    selectedCountryId: selectedCountryId,
    selectedStateId: selectedStateId
  }
}

function receiveLgasForLocationSelector(lgas, selectedCountryId, selectedStateId) {
  return {
    type:  types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
    lgas: lgas,
    selectedCountryId: selectedCountryId,
    selectedStateId: selectedStateId,
    lastRefreshed: new Date()
  }
}

export const fetchCountriesForLocationSelector = function(forceRefresh, lastRefreshed, selectedCountryId, selectedStateId) {
  return dispatch => {
    const now = new Date()
    const fiveMinutes = 300000
    if(forceRefresh || !lastRefreshed || Math.abs(now.getTime() - lastRefreshed.getTime()) > fiveMinutes) {
      dispatch(requestCountriesForLocationSelector())
      let path = '/geography/country-select-list'
      if(selectedCountryId) {
        path += '/' + selectedCountryId
        if(selectedStateId) {
          path += '/' + selectedStateId
        }
      }
      return aspectFetch(path)
        .then(json => dispatch(receiveCountriesForLocationSelector(json.data)))
        .catch(err => dispatch(addError('Loading countries failed', err.message, err)))
    }
  }
}
