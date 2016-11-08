import _ from 'lodash'
import Immutable from 'immutable'
import { aspectFetch } from '../shared/utils/fetch'
import { addError } from '../error/ErrorRedux'

export const types = {
  REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR: 'REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR',
  RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR: 'RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR',
  REQUEST_STATES_FOR_LOCATION_SELECTOR: 'REQUEST_STATES_FOR_LOCATION_SELECTOR',
  RECEIVE_STATES_FOR_LOCATION_SELECTOR: 'RECEIVE_STATES_FOR_LOCATION_SELECTOR',
  REQUEST_LGAS_FOR_LOCATION_SELECTOR: 'REQUEST_LGAS_FOR_LOCATION_SELECTOR',
  RECEIVE_LGAS_FOR_LOCATION_SELECTOR: 'RECEIVE_LGAS_FOR_LOCATION_SELECTOR'
}

/*
 * ---------------- Action Creators -----------------
 */
function createRequestCountriesForLocationSelector() {
  return { type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR }
}

function createReceiveCountriesForLocationSelector(countries) {
  return {
    type:  types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
    countries: countries,
    lastRefreshed: new Date()
  }
}

function createRequestStatesForLocationSelector(selectedCountryId) {
  return {
    type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
    selectedCountryId: selectedCountryId
  }
}

function createReceiveStatesForLocationSelector(states, selectedCountryId) {
  return {
    type:  types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
    states: states,
    selectedCountryId: selectedCountryId,
    lastRefreshed: new Date()
  }
}

function createRequestLgasForLocationSelector(selectedCountryId, selectedStateId) {
  return {
    type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
    selectedCountryId: selectedCountryId,
    selectedStateId: selectedStateId
  }
}

function createReceiveLgasForLocationSelector(lgas, selectedCountryId, selectedStateId) {
  return {
    type:  types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
    lgas: lgas,
    selectedCountryId: selectedCountryId,
    selectedStateId: selectedStateId,
    lastRefreshed: new Date()
  }
}

const cacheExpiryTime = 5 * 60 * 1000 //five minutes

export const fetchCountriesForLocationSelector = function(forceRefresh, countriesState,
                                                          selectedCountryId, selectedStateId) {
  const now = new Date()
  if(!countriesState.get('loading') && (forceRefresh || !countriesState.get('lastRefreshed') ||
    Math.abs(now.getTime() - countriesState.get('lastRefreshed').getTime()) > cacheExpiryTime ||
    selectedCountryId)) {
    if(forceRefresh || !countriesState.get('lastRefreshed') ||
      Math.abs(now.getTime() - countriesState.get('lastRefreshed').getTime()) > cacheExpiryTime) {
      return dispatch => {
        dispatch(createRequestCountriesForLocationSelector())
        let path = '/geography/country-select-list'
        if(selectedCountryId) {
          path += '/' + selectedCountryId
          if(selectedStateId) {
            path += '/' + selectedStateId
          }
        }
        return aspectFetch(path)
          .then(json => dispatch(createReceiveCountriesForLocationSelector(json.data)))
          .catch(err => dispatch(addError('Loading countries failed', err.message, err)))
      }
    } else if (selectedCountryId) {
      const selectedCountry = countriesState.get('items').find(country => country.get('id') === selectedCountryId)
      return fetchStatesForLocationSelector(false, selectedCountry, selectedStateId)
    }
  }
  return () => {}
}

export const fetchStatesForLocationSelector = function(forceRefresh, selectedCountry, selectedStateId) {
  const now = new Date()
  if(!selectedCountry.getIn(['children', 'loading']) && (forceRefresh || !selectedCountry.getIn(['children', 'lastRefreshed']) ||
    Math.abs(now.getTime() - selectedCountry.getIn(['children', 'lastRefreshed']).getTime()) > cacheExpiryTime ||
    selectedStateId)) {
    if(forceRefresh || !selectedCountry.getIn(['children', 'lastRefreshed']) ||
      Math.abs(now.getTime() - selectedCountry.getIn(['children', 'lastRefreshed']).getTime()) > cacheExpiryTime)
    {
      return dispatch => {
        dispatch(createRequestStatesForLocationSelector(selectedCountry.get('id')))
        let path = '/geography/state-select-list/' + selectedCountry.get('id')
        if(selectedStateId) {
          path += '/' + selectedStateId
        }
        return aspectFetch(path)
          .then(json => dispatch(createReceiveStatesForLocationSelector(json.data, selectedCountry.get('id'))))
          .catch(err => dispatch(addError('Loading states failed', err.message, err)))
      }
    } else if(selectedStateId) {
      const selectedState = selectedCountry.getIn(['children', 'items']).find(state => state.get('id') === selectedStateId)
      return fetchLgasForLocationSelector(false, selectedCountry, selectedState)
    }
  }
  return () => {}
}

export const fetchLgasForLocationSelector = function(forceRefresh, selectedCountry, selectedState) {
  const now = new Date()
  if(selectedState && !selectedState.getIn(['children', 'loading']) &&
    (forceRefresh || !selectedState.getIn(['children', 'lastRefreshed']) ||
    Math.abs(now.getTime() - selectedState.getIn(['children', 'lastRefreshed']).getTime()) > cacheExpiryTime)) {
    return dispatch => {
      dispatch(createRequestLgasForLocationSelector(selectedCountry.get('id'), selectedState.get('id')))
      let path = '/geography/lga-select-list/' + selectedState.get('id')
      return aspectFetch(path)
        .then(json => dispatch(createReceiveLgasForLocationSelector(json.data, selectedCountry.get('id'), selectedState.get('id'))))
        .catch(err => dispatch(addError('Loading LGAs failed', err.message, err)))
    }
  }
  return () => {}
}

/*
 * ---------------- Reducers -----------------
 */
export const LazyLoadItems = Immutable.Record({
  loading: false,
  items: Immutable.List(),
  lastRefreshed: undefined
})

export const LazyLoadParent = Immutable.Record({
  id: undefined,
  name: undefined,
  children: new LazyLoadItems()
})

export const LazyLoadChild = Immutable.Record({
  id: undefined,
  name: undefined
})

const Geography = Immutable.Record({
  countriesForLocationSelector: new LazyLoadItems({
    loading: false,
    items: Immutable.List([]),
    lastRefreshed: undefined
  })
})

const initialState = new Geography()

function requestCountriesForLocationSelector(state) {
  return state.setIn(['countriesForLocationSelector', 'loading'], true)
}

function receiveCountriesForLocationSelector(state, countries, lastRefreshed) {
  return state.setIn(['countriesForLocationSelector'], new LazyLoadItems({
    loading: false,
    lastRefreshed: lastRefreshed,
    items: new Immutable.List(_.map(countries, country => new LazyLoadParent({
      id: country.id,
      name: country.name,
      children: new LazyLoadItems({
        loading: false,
        lastRefreshed: country.states ? lastRefreshed : undefined,
        items: country.states ? new Immutable.List(_.map(country.states, state => new LazyLoadParent({
          id: state.id,
          name: state.name,
          children: new LazyLoadItems({
            loading: false,
            lastRefreshed: state.lgas ? lastRefreshed: undefined,
            items: state.lgas ? new Immutable.List(_.map(state.lgas, lga => new LazyLoadChild(lga))) : undefined
          })
        }))) : undefined
      })
    })))
  }))
}

function requestStatesForLocationSelector(state, selectedCountryId) {
  if(state.getIn(['countriesForLocationSelector', 'items'])) {
    const selectedCountry = state.getIn(['countriesForLocationSelector', 'items']).find(
      country => country.get('id') === selectedCountryId)
    if (selectedCountry) {
      return state.setIn(['countriesForLocationSelector', 'items',
        state.getIn(['countriesForLocationSelector', 'items']).indexOf(selectedCountry),
        'children', 'loading'], true)
    }
  }
  return state
}

function receiveStatesForLocationSelector(state, states, selectedCountryId, lastRefreshed) {
  if(state.getIn(['countriesForLocationSelector', 'items'])) {
    const selectedCountry = state.getIn(['countriesForLocationSelector', 'items']).find(
      country => country.get('id') === selectedCountryId)
    if (selectedCountry) {
      return state.mergeDeepIn(['countriesForLocationSelector', 'items',
        state.getIn(['countriesForLocationSelector', 'items']).indexOf(selectedCountry),
        'children'], {
          loading: false,
          lastRefreshed: lastRefreshed,
          items: new Immutable.List(_.map(states, state => new LazyLoadParent({
            id: state.id,
            name: state.name,
            children: new LazyLoadItems({
              loading: false,
              lastRefreshed: state.lgas ? lastRefreshed : undefined,
              items: state.lgas ? new Immutable.List(_.map(state.lgas, lga => new LazyLoadChild(lga))) : undefined
            })
          })))
        })
    }
  }
  return state
}

function requestLgasForLocationSelector(state, selectedCountryId, selectedStateId) {
  if(state.getIn(['countriesForLocationSelector', 'items'])) {
    const selectedCountry = state.getIn(['countriesForLocationSelector', 'items']).find(
      country => country.get('id') === selectedCountryId)
    if(selectedCountry && selectedCountry.getIn(['children', 'items'])) {
      const selectedState = selectedCountry.getIn(['children', 'items']).find(
        state => state.get('id') === selectedStateId)
      if(selectedState) {
        return state.setIn(['countriesForLocationSelector', 'items',
          state.getIn(['countriesForLocationSelector', 'items']).indexOf(selectedCountry),
          'children', 'items', selectedCountry.getIn(['children', 'items']).indexOf(selectedState),
          'children', 'loading'], true)
      }
    }
  }
  return state
}

function receiveLgasForLocationSelector(state, lgas, selectedCountryId, selectedStateId, lastRefreshed) {
  if(state.getIn(['countriesForLocationSelector', 'items'])) {
    const selectedCountry = state.getIn(['countriesForLocationSelector', 'items']).find(
      country => country.get('id') === selectedCountryId)
    if (selectedCountry && selectedCountry.getIn(['children', 'items'])) {
      const selectedState = selectedCountry.getIn(['children', 'items']).find(
        state => state.get('id') === selectedStateId)
      if(selectedState) {
        return state.mergeDeepIn(['countriesForLocationSelector', 'items',
          state.getIn(['countriesForLocationSelector', 'items']).indexOf(selectedCountry),
          'children', 'items', selectedCountry.getIn(['children', 'items']).indexOf(selectedState),
          'children'], {
            loading: false,
            lastRefreshed: lastRefreshed,
            items: new Immutable.List(_.map(lgas, lga => new LazyLoadChild(lga)))
          })
      }
    }
  }
  return state
}

export default function geographyReducer(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR:
    return requestCountriesForLocationSelector(state)
  case types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR:
    return receiveCountriesForLocationSelector(state, action.countries,
      action.lastRefreshed)
  case types.REQUEST_STATES_FOR_LOCATION_SELECTOR:
    return requestStatesForLocationSelector(state, action.selectedCountryId)
  case types.RECEIVE_STATES_FOR_LOCATION_SELECTOR:
    return receiveStatesForLocationSelector(state, action.states,
      action.selectedCountryId, action.lastRefreshed)
  case types.REQUEST_LGAS_FOR_LOCATION_SELECTOR:
    return requestLgasForLocationSelector(state, action.selectedCountryId,
      action.selectedStateId)
  case types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR:
    return receiveLgasForLocationSelector(state, action.lgas, action.selectedCountryId,
      action.selectedStateId, action.lastRefreshed)
  }
  return state
}
