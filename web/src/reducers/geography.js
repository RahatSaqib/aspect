import _ from 'lodash'
import Immutable from 'immutable'
import types from './../constants/action_types'

const LazyLoadItems = Immutable.Record({
    loading: false,
    items: Immutable.List(),
    lastRefreshed: undefined
  }), LazyLoadParent = Immutable.Record({
    id: undefined,
    name: undefined,
    children: new LazyLoadItems()
  }), LazyLoadChild = Immutable.Record({
    id: undefined,
    name: undefined
  })

const Geograpy = Immutable.Record({
  countriesForLocationSelector: new LazyLoadItems({
    loading: false,
    items: Immutable.List([]),
    lastRefreshed: undefined
  })
})

const initialState = new Geograpy()

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

function countries(state = initialState, action) {
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

export default countries
