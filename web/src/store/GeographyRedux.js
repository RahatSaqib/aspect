import Immutable from 'immutable'
import map from 'lodash/map'
import { defineMessages } from 'react-intl'
import { errorPleaseTryAgainInAFewMinutes } from '../utils/error/CommonErrorNotifications'
import { aspectFetch } from '../utils/utils/fetch'

export const types = {
  REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR: 'REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR',
  RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR: 'RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR',
}

/*
 * ---------------- Action Creators -----------------
 */
function createRequestCountriesForLocationSelector() {
  return { type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR }
}

function createReceiveCountriesForLocationSelector(countries) {
  return {
    type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
    countries,
    lastRefreshed: new Date(),
  }
}

const cacheExpiryTime = 5 * 60 * 1000 // five minutes

function isExpired(lastRefreshed) {
  const now = new Date()
  return !lastRefreshed || Math.abs(now.getTime() - lastRefreshed.getTime()) > cacheExpiryTime
}

const doFetchCountries = dispatch => {
  dispatch(createRequestCountriesForLocationSelector())
  return aspectFetch('/geography/country-select-list', {
    errorNotifications: {
      default: errorPleaseTryAgainInAFewMinutes(
        defineMessages({
          title: {
            id: 'errorResponseMessages.fetchCountriesForLocationSelector.GET.default.title',
            defaultMessage: 'Error Loading Countries',
          },
        })
      ),
    },
  }).then(json => dispatch(createReceiveCountriesForLocationSelector(json.data)))
}

export const fetchCountries = () => dispatch => doFetchCountries(dispatch)

export const fetchCountriesForLocationSelector = countriesState => dispatch => {
  if (countriesState.get('loading') || !isExpired(countriesState.get('lastRefreshed'))) {
    return
  }
  return doFetchCountries(dispatch)
}

/*
 * ---------------- Reducers -----------------
 */
const EMPTY_LIST = Immutable.List()

export const LazyLoadItems = Immutable.Record({
  loading: false,
  items: EMPTY_LIST,
  lastRefreshed: undefined,
})

const LazyLoadParent = Immutable.Record({
  id: undefined,
  name: undefined,
  children: new LazyLoadItems(),
})

const LazyLoadChild = Immutable.Record({
  id: undefined,
  name: undefined,
})

const Geography = Immutable.Record({
  countriesForLocationSelector: new LazyLoadItems({
    loading: false,
    items: EMPTY_LIST,
    lastRefreshed: undefined,
  }),
})

const initialState = new Geography()

function requestCountriesForLocationSelector(state) {
  return state.setIn(['countriesForLocationSelector', 'loading'], true)
}

function receiveCountriesForLocationSelector(state, countries, lastRefreshed) {
  return state.setIn(
    ['countriesForLocationSelector'],
    new LazyLoadItems({
      loading: false,
      lastRefreshed,
      items: Immutable.List(
        map(
          countries,
          country =>
            new LazyLoadParent({
              id: country.id,
              name: country.name,
              children: new LazyLoadItems({
                loading: false,
                lastRefreshed: country.states ? lastRefreshed : undefined,
                items: country.states
                  ? Immutable.List(
                      map(
                        country.states,
                        state =>
                          new LazyLoadParent({
                            id: state.id,
                            name: state.name,
                            children: new LazyLoadItems({
                              loading: false,
                              lastRefreshed: state.lgas ? lastRefreshed : undefined,
                              items: state.lgas
                                ? Immutable.List(map(state.lgas, lga => new LazyLoadChild(lga)))
                                : EMPTY_LIST,
                            }),
                          })
                      )
                    )
                  : EMPTY_LIST,
              }),
            })
        )
      ),
    })
  )
}

export default function geographyReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR:
      return requestCountriesForLocationSelector(state)
    case types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR:
      return receiveCountriesForLocationSelector(state, action.countries, action.lastRefreshed)
    default:
      return state
  }
}
