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

const fiveMinutes = 300000 //five minutes

export const fetchCountriesForLocationSelector = function(forceRefresh, countriesState,
                                                          selectedCountryId, selectedStateId) {
  return dispatch => {
    const now = new Date()
    if(!countriesState.get('loading') && (forceRefresh || !countriesState.get('lastRefreshed') ||
      Math.abs(now.getTime() - countriesState.get('lastRefreshed').getTime()) > fiveMinutes)) {
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
        .catch(err => {
          receiveCountriesForLocationSelector([])
          dispatch(addError('Loading countries failed', err.message, err))
        })
    }
  }
}
export const fetchStatesForLocationSelector = function(forceRefresh, selectedCountry) {
  return dispatch => {
    const now = new Date()
    if(!selectedCountry.getIn(['children', 'loading']) && (forceRefresh || !selectedCountry.getIn(['children', 'lastRefreshed']) ||
      Math.abs(now.getTime() - selectedCountry.getIn(['children', 'lastRefreshed']).getTime()) > fiveMinutes)) {
      dispatch(requestStatesForLocationSelector(selectedCountry.get('id')))
      let path = '/geography/state-select-list/' + selectedCountry.get('id')
      return aspectFetch(path)
        .then(json => dispatch(receiveStatesForLocationSelector(json.data, selectedCountry.get('id'))))
        .catch(err => {
          receiveStatesForLocationSelector([], selectedCountry.get('id'))
          dispatch(addError('Loading states failed', err.message, err))
        })
    }
  }
}

export const fetchLgasForLocationSelector = function(forceRefresh, selectedCountry, selectedState) {
  return dispatch => {
    const now = new Date()
    if(!selectedState.getIn(['children', 'loading']) && (forceRefresh || !selectedState.getIn(['children', 'lastRefreshed']) ||
      Math.abs(now.getTime() - selectedState.getIn(['children', 'lastRefreshed']).getTime()) > fiveMinutes)) {
      dispatch(requestLgasForLocationSelector(selectedCountry.get('id'), selectedState.get('id')))
      let path = '/geography/lga-select-list/' + selectedCountry.get('id') + '/' + selectedState.get('id')
      return aspectFetch(path)
        .then(json => dispatch(receiveLgasForLocationSelector(json.data, selectedCountry.get('id'), selectedState.get('id'))))
        .catch(err => {
          receiveStatesForLocationSelector([], selectedCountry.get('id'), selectedState.get('id'))
          dispatch(addError('Loading LGAs failed', err.message, err))
        })
    }
  }
}
