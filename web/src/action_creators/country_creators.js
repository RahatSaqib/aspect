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

export function fetchCountriesForSelectLists(forceRefresh, lastRefreshed) {
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
