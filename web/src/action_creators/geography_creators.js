import { aspectFetch } from '../utils/fetch'
import { addError } from './error_creators'
import types from './../constants/action_types'

function requestCountriesForSelectLists() {
  return { type: types.REQUEST_COUNTRIES_FOR_SELECT_LISTS }
}

function receiveCountriesForSelectLists(countries) {
  return {
    type:  types.RECEIVE_COUNTRIES_FOR_SELECT_LISTS,
    countries: countries,
    lastRefreshed: new Date()
  }
}

export const fetchCountriesForSelectLists = function(forceRefresh, lastRefreshed) {
  return dispatch => {
    const now = new Date()
    const fiveMinutes = 300000
    if(forceRefresh || !lastRefreshed || Math.abs(now.getTime() - lastRefreshed.getTime()) > fiveMinutes) {
      dispatch(requestCountriesForSelectLists())
      return aspectFetch('/geography/select-list')
        .then(json => dispatch(receiveCountriesForSelectLists(json.data)))
        .catch(err => dispatch(addError('Loading countries failed', err.message, err)))
    }
  }
}

function requestCountriesForLocationSelector(selectedCountryId, selectedStateId) {
  return {
    type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR,
    selectedCountryId: selectedCountryId,
    selectedStateId: selectedStateId,
  }
}

function receiveCountriesForLocationSelector(countries, selectedCountryId, selectedStateId) {
  return {
    type:  types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
    countries: countries,
    selectedCountryId: selectedCountryId,
    selectedStateId: selectedStateId,
    lastRefreshed: new Date()
  }
}

export const fetchCountriesForLocationSelector = function(selectedCountryId, selectedStateId, forceRefresh, lastRefreshed) {
  return dispatch => {
    const now = new Date()
    const fiveMinutes = 300000
    if(forceRefresh || !lastRefreshed || Math.abs(now.getTime() - lastRefreshed.getTime()) > fiveMinutes) {
      dispatch(requestCountriesForLocationSelector(selectedCountryId, selectedStateId))
      let path = '/geography/country-select-list'
      if(selectedCountryId) {
        path += '/' + selectedCountryId
        if(selectedStateId) {
          path += '/' + selectedStateId
        }
      }
      return aspectFetch(path)
        .then(json => dispatch(receiveCountriesForLocationSelector(json.data, selectedCountryId, selectedStateId)))
        .catch(err => dispatch(addError('Loading countries failed', err.message, err)))
    }
  }
}
