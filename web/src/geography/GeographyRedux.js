import { defineMessages } from 'react-intl'
import _ from 'lodash'
import Immutable from 'immutable'
import { aspectFetch } from '../shared/utils/fetch'
import { errorPleaseTryAgainInAFewMinutes } from '../error/CommonErrorNotifications'

export const types = {
  REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR:
    'REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR',
  RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR:
    'RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR',
  REQUEST_STATES_FOR_LOCATION_SELECTOR: 'REQUEST_STATES_FOR_LOCATION_SELECTOR',
  RECEIVE_STATES_FOR_LOCATION_SELECTOR: 'RECEIVE_STATES_FOR_LOCATION_SELECTOR',
  REQUEST_LGAS_FOR_LOCATION_SELECTOR: 'REQUEST_LGAS_FOR_LOCATION_SELECTOR',
  RECEIVE_LGAS_FOR_LOCATION_SELECTOR: 'RECEIVE_LGAS_FOR_LOCATION_SELECTOR',
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

function createRequestStatesForLocationSelector(selectedCountryId) {
  return {
    type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
    selectedCountryId,
  }
}

function createReceiveStatesForLocationSelector(states, selectedCountryId) {
  return {
    type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
    states,
    selectedCountryId,
    lastRefreshed: new Date(),
  }
}

function createRequestLgasForLocationSelector(
  selectedCountryId,
  selectedStateId
) {
  return {
    type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
    selectedCountryId,
    selectedStateId,
  }
}

function createReceiveLgasForLocationSelector(
  lgas,
  selectedCountryId,
  selectedStateId
) {
  return {
    type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
    lgas,
    selectedCountryId,
    selectedStateId,
    lastRefreshed: new Date(),
  }
}

const cacheExpiryTime = 5 * 60 * 1000 // five minutes

function isExpired(lastRefreshed) {
  const now = new Date()
  return (
    !lastRefreshed ||
    Math.abs(now.getTime() - lastRefreshed.getTime()) > cacheExpiryTime
  )
}

export const fetchCountriesForLocationSelector = countriesState => dispatch => {
  if (
    countriesState.get('loading') ||
    !isExpired(countriesState.get('lastRefreshed'))
  ) {
    return
  }
  dispatch(createRequestCountriesForLocationSelector())
  return aspectFetch('/geography/country-select-list', {
    errorNotifications: {
      default: errorPleaseTryAgainInAFewMinutes(
        defineMessages({
          title: {
            id:
              'errorResponseMessages.fetchCountriesForLocationSelector.GET.default.title',
            defaultMessage: 'Error Loading Countries',
          },
        })
      ),
    },
  }).then(json =>
    dispatch(createReceiveCountriesForLocationSelector(json.data))
  )
}

export const fetchStatesForLocationSelector = selectedCountry => dispatch => {
  if (
    selectedCountry.getIn(['children', 'loading']) ||
    !isExpired(selectedCountry.getIn(['children', 'lastRefreshed']))
  ) {
    return
  }
  dispatch(createRequestStatesForLocationSelector(selectedCountry.get('id')))
  return aspectFetch(
    `/geography/state-select-list/${selectedCountry.get('id')}`,
    {
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.fetchStatesForLocationSelector.GET.default.title',
              defaultMessage: 'Error Loading States for {countryName}',
            },
          }),
          { countryName: selectedCountry.get('name') }
        ),
      },
    }
  ).then(json =>
    dispatch(
      createReceiveStatesForLocationSelector(
        json.data,
        selectedCountry.get('id')
      )
    )
  )
}

export const fetchLgasForLocationSelector = (
  selectedCountry,
  selectedState
) => dispatch => {
  if (
    selectedState.getIn(['children', 'loading']) ||
    !isExpired(selectedState.getIn(['children', 'lastRefreshed']))
  ) {
    return
  }
  dispatch(
    createRequestLgasForLocationSelector(
      selectedCountry.get('id'),
      selectedState.get('id')
    )
  )
  return aspectFetch(`/geography/lga-select-list/${selectedState.get('id')}`, {
    errorNotifications: {
      default: errorPleaseTryAgainInAFewMinutes(
        defineMessages({
          title: {
            id:
              'errorResponseMessages.fetchLgasForLocationSelector.GET.default.title',
            defaultMessage: 'Error Loading Areas for {stateName}',
          },
        }),
        { stateName: selectedCountry.get('selectedState') }
      ),
    },
  }).then(json =>
    dispatch(
      createReceiveLgasForLocationSelector(
        json.data,
        selectedCountry.get('id'),
        selectedState.get('id')
      )
    )
  )
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

export const LazyLoadParent = Immutable.Record({
  id: undefined,
  name: undefined,
  children: new LazyLoadItems(),
})

export const LazyLoadChild = Immutable.Record({
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
      items: new Immutable.List(
        _.map(
          countries,
          country =>
            new LazyLoadParent({
              id: country.id,
              name: country.name,
              children: new LazyLoadItems({
                loading: false,
                lastRefreshed: country.states ? lastRefreshed : undefined,
                items: country.states
                  ? new Immutable.List(
                      _.map(
                        country.states,
                        state =>
                          new LazyLoadParent({
                            id: state.id,
                            name: state.name,
                            children: new LazyLoadItems({
                              loading: false,
                              lastRefreshed: state.lgas
                                ? lastRefreshed
                                : undefined,
                              items: state.lgas
                                ? new Immutable.List(
                                    _.map(
                                      state.lgas,
                                      lga => new LazyLoadChild(lga)
                                    )
                                  )
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

function requestStatesForLocationSelector(state, selectedCountryId) {
  if (state.getIn(['countriesForLocationSelector', 'items'])) {
    const selectedCountry = state
      .getIn(['countriesForLocationSelector', 'items'])
      .find(country => country.get('id') === selectedCountryId)
    if (selectedCountry) {
      return state.setIn(
        [
          'countriesForLocationSelector',
          'items',
          state
            .getIn(['countriesForLocationSelector', 'items'])
            .indexOf(selectedCountry),
          'children',
          'loading',
        ],
        true
      )
    }
  }
  return state
}

function receiveStatesForLocationSelector(
  state,
  states,
  selectedCountryId,
  lastRefreshed
) {
  if (state.getIn(['countriesForLocationSelector', 'items'])) {
    const selectedCountry = state
      .getIn(['countriesForLocationSelector', 'items'])
      .find(country => country.get('id') === selectedCountryId)
    if (selectedCountry) {
      return state.mergeDeepIn(
        [
          'countriesForLocationSelector',
          'items',
          state
            .getIn(['countriesForLocationSelector', 'items'])
            .indexOf(selectedCountry),
          'children',
        ],
        {
          loading: false,
          lastRefreshed,
          items: new Immutable.List(
            _.map(
              states,
              state =>
                new LazyLoadParent({
                  id: state.id,
                  name: state.name,
                  children: new LazyLoadItems({
                    loading: false,
                    lastRefreshed: state.lgas ? lastRefreshed : undefined,
                    items: state.lgas
                      ? new Immutable.List(
                          _.map(state.lgas, lga => new LazyLoadChild(lga))
                        )
                      : EMPTY_LIST,
                  }),
                })
            )
          ),
        }
      )
    }
  }
  return state
}

function requestLgasForLocationSelector(
  state,
  selectedCountryId,
  selectedStateId
) {
  if (state.getIn(['countriesForLocationSelector', 'items'])) {
    const selectedCountry = state
      .getIn(['countriesForLocationSelector', 'items'])
      .find(country => country.get('id') === selectedCountryId)
    if (selectedCountry && selectedCountry.getIn(['children', 'items'])) {
      const selectedState = selectedCountry
        .getIn(['children', 'items'])
        .find(state => state.get('id') === selectedStateId)
      if (selectedState) {
        return state.setIn(
          [
            'countriesForLocationSelector',
            'items',
            state
              .getIn(['countriesForLocationSelector', 'items'])
              .indexOf(selectedCountry),
            'children',
            'items',
            selectedCountry.getIn(['children', 'items']).indexOf(selectedState),
            'children',
            'loading',
          ],
          true
        )
      }
    }
  }
  return state
}

function receiveLgasForLocationSelector(
  state,
  lgas,
  selectedCountryId,
  selectedStateId,
  lastRefreshed
) {
  if (state.getIn(['countriesForLocationSelector', 'items'])) {
    const selectedCountry = state
      .getIn(['countriesForLocationSelector', 'items'])
      .find(country => country.get('id') === selectedCountryId)
    if (selectedCountry && selectedCountry.getIn(['children', 'items'])) {
      const selectedState = selectedCountry
        .getIn(['children', 'items'])
        .find(state => state.get('id') === selectedStateId)
      if (selectedState) {
        return state.mergeDeepIn(
          [
            'countriesForLocationSelector',
            'items',
            state
              .getIn(['countriesForLocationSelector', 'items'])
              .indexOf(selectedCountry),
            'children',
            'items',
            selectedCountry.getIn(['children', 'items']).indexOf(selectedState),
            'children',
          ],
          {
            loading: false,
            lastRefreshed,
            items: new Immutable.List(
              _.map(lgas, lga => new LazyLoadChild(lga))
            ),
          }
        )
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
      return receiveCountriesForLocationSelector(
        state,
        action.countries,
        action.lastRefreshed
      )
    case types.REQUEST_STATES_FOR_LOCATION_SELECTOR:
      return requestStatesForLocationSelector(state, action.selectedCountryId)
    case types.RECEIVE_STATES_FOR_LOCATION_SELECTOR:
      return receiveStatesForLocationSelector(
        state,
        action.states,
        action.selectedCountryId,
        action.lastRefreshed
      )
    case types.REQUEST_LGAS_FOR_LOCATION_SELECTOR:
      return requestLgasForLocationSelector(
        state,
        action.selectedCountryId,
        action.selectedStateId
      )
    case types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR:
      return receiveLgasForLocationSelector(
        state,
        action.lgas,
        action.selectedCountryId,
        action.selectedStateId,
        action.lastRefreshed
      )
    default:
      return state
  }
}
