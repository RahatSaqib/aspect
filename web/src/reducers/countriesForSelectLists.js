import Immutable from 'immutable'
import types from './../constants/action_types'

function requestCountriesForSelectLists(state) {
  return state.merge(state, { loading: true })
}

function receiveCountriesForSelectLists(state, countries, lastRefreshed) {
  return state.merge(state, {
    loading: false,
    countries: countries,
    lastRefreshed: lastRefreshed
  })
}

const CountriesForSelectLists = Immutable.Record({
  loading: false,
  countries: Immutable.List(),
  lastRefreshed: undefined
})

const initialState = new CountriesForSelectLists()

function countriesForSelectLists(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_COUNTRIES_FOR_SELECT_LISTS:
    return requestCountriesForSelectLists(state, 'country')
  case types.RECEIVE_COUNTRIES_FOR_SELECT_LISTS:
    return receiveCountriesForSelectLists(state, action.countries, action.lastRefreshed)
  }
  return state
}

export default countriesForSelectLists
