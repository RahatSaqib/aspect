import Immutable from 'immutable'
import _ from 'lodash'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import geography, { types, LazyLoadItems, LazyLoadParent, LazyLoadChild } from './GeographyRedux'

describe('geography reducer', () => {
  describe('initial state', () => {
    let initialState

    beforeEach(() => {
      initialState = geography(undefined, {})
    })

    it('should contain an empty LazyLoadItems object that isn\'t loading and has not been refreshed yet', () => {
      expect(initialState.countriesForLocationSelector).toBeInstanceOf(Immutable.Record)
      expect(initialState.countriesForLocationSelector.loading).toBe()
      expect(initialState.countriesForLocationSelector.lastRefreshed).not.toBeDefined()
      expect(initialState.countriesForLocationSelector.items).toBeInstanceOf(Immutable.List)
      expect(initialState.countriesForLocationSelector.items.size).toEqual(0)
    })
  })

  describe('actions', () => {
    describe('REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR', () => {
      it('should show that countries are busy loading', () => {
        const state = geography(undefined, { type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR })
        expect(state.countriesForLocationSelector.loading).toBe(true)
      })
    })

    describe('RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR', () => {
      it('should show that countries are not loading anymore and update the last refreshed date', () => {
        const now = new Date()
        const state = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
          countries: [],
          lastRefreshed: now
        })
        expect(state.countriesForLocationSelector.loading).toBe()
        expect(state.countriesForLocationSelector.lastRefreshed).toEqual(now)
      })

      describe('with shallow country list', () => {
        it('should update the items to a list of LazyLoadParents', () => {
          const now = new Date()
          const countriesReceived = [{ id: 1, name: 'South Africa' }, { id: 2, name: 'United States' }]
          const state = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
            countries: countriesReceived,
            lastRefreshed: now
          })
          const countryIds = _.map(countriesReceived, 'id')
          const countryNames = _.map(countriesReceived, 'name')

          expect(state.countriesForLocationSelector.items).toBeInstanceOf(Immutable.List)
          state.countriesForLocationSelector.items.forEach((countryRecord) => {
            expect(countryIds).toContain(countryRecord.id)
            expect(countryNames).toContain(countryRecord.name)
            expect(countryRecord.children).toBeInstanceOf(Immutable.Record)
            expect(countryRecord.children.loading).toBe()
            expect(countryRecord.children.items.isEmpty()).toBe(true)
            expect(countryRecord.children.lastRefreshed).not.toBeDefined()
          })
        })
      })

      describe('with deep country list', () => {
        it('should update the items to a list of LazyLoadParents and populate the state and lga children', () => {
          const now = new Date()
          const countriesReceived = [{
            id: 1,
            name: 'South Africa',
            states: [{ id: 1, name: 'Eastern Cape' },
              {
                id: 2,
                name: 'Gauteng',
                lgas: [{ id: 1, name: 'Midrand' },
                  { id: 2, name: 'Pretoria' },
                  { id: 3, name: 'Randburg' }]
              }, { id: 3, name: 'Western Cape' }] },
              { id: 2, name: 'United States' }]
          const state = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
            countries: countriesReceived,
            lastRefreshed: now
          })
          const countryIds = _.map(countriesReceived, 'id')
          const countryNames = _.map(countriesReceived, 'name')

          expect(state.countriesForLocationSelector.items).toBeInstanceOf(Immutable.List)
          state.countriesForLocationSelector.items.forEach((countryRecord) => {
            expect(countryIds).toContain(countryRecord.id)
            expect(countryNames).toContain(countryRecord.name)
            expect(countryRecord.children).toBeInstanceOf(Immutable.Record)
            expect(countryRecord.children.loading).toBe()
            const countryReceived = _.find(countriesReceived, { id: countryRecord.id })
            if (countryReceived.states) {
              const stateIds = _.map(countryReceived.states, 'id')
              const stateNames = _.map(countryReceived.states, 'name')
              expect(countryRecord.children.items).toBeInstanceOf(Immutable.List)
              expect(countryRecord.children.lastRefreshed).toEqual(now)
              countryRecord.children.items.forEach((stateRecord) => {
                expect(stateIds).toContain(stateRecord.id)
                expect(stateNames).toContain(stateRecord.name)
                expect(stateRecord.children).toBeInstanceOf(Immutable.Record)
                expect(stateRecord.children.loading).toBe()
                const stateReceived = _.find(countryReceived.states, { id: stateRecord.id })
                if (stateReceived.lgas) {
                  const lgaIds = _.map(stateReceived.lgas, 'id')
                  const lgaNames = _.map(stateReceived.lgas, 'name')
                  expect(stateRecord.children.items).toBeInstanceOf(Immutable.List)
                  expect(stateRecord.children.lastRefreshed).toEqual(now)
                  stateRecord.children.items.forEach((lgaRecord) => {
                    expect(lgaIds).toContain(lgaRecord.id)
                    expect(lgaNames).toContain(lgaRecord.name)
                  })
                } else {
                  expect(stateRecord.children.items.isEmpty()).toBe(true)
                  expect(stateRecord.children.lastRefreshed).not.toBeDefined()
                }
              })
            } else {
              expect(countryRecord.children.items.isEmpty()).toBe(true)
              expect(countryRecord.children.lastRefreshed).not.toBeDefined()
            }
          })
        })
      })
    })

    describe('REQUEST_STATES_FOR_LOCATION_SELECTOR', () => {
      describe('when countries haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const initialState = geography(undefined, {})
          const newState = geography(initialState, {
            type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1
          })

          expect(initialState).toEqual(newState)
        })
      })

      describe('when countries have been loaded', () => {
        it('should show that states for selected country are busy loading', () => {
          const now = new Date()
          const selectedCountryId = 1
          const countriesReceived = [{ id: 1, name: 'South Africa' }, { id: 2, name: 'United States' }]
          const state = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
            countries: countriesReceived,
            lastRefreshed: now
          })
          const newState = geography(state, {
            type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
            selectedCountryId
          })
          const selectedCountry = newState.countriesForLocationSelector.items
            .find(val => val.id === selectedCountryId)

          expect(selectedCountry.children.loading).toBe(true)
        })
      })
    })

    describe('RECEIVE_STATES_FOR_LOCATION_SELECTOR', () => {
      describe('when countries haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const initialState = geography(undefined, {})
          const newState = geography(initialState, {
            type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
            states: [{ id: 1, name: 'Eastern Cape' },
              { id: 2, name: 'Gauteng' },
              { id: 3, name: 'Western Cape' }],
            selectedCountryId: 1
          })

          expect(initialState).toEqual(newState)
        })
      })

      describe('when countries have been loaded', () => {
        let initialState
        const countries = [{ id: 1, name: 'South Africa' }, { id: 2, name: 'United States' }]
        const now = new Date()
        const selectedCountryId = 1
        let selectedCountry = null
        let indexOfSelectedCountry = -1

        beforeEach(() => {
          initialState = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
            countries,
            lastRefreshed: now
          })
          selectedCountry = initialState.countriesForLocationSelector.items
            .find(country => country.id === selectedCountryId)
          indexOfSelectedCountry = initialState.countriesForLocationSelector.items
            .indexOf(selectedCountry)
          initialState = geography(initialState, {
            type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
            selectedCountryId
          })
        })

        it('should show that states for the selected country are not loading anymore and update the last refreshed date', () => {
          expect(initialState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'loading'])).toBe(true)
          expect(initialState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'lastRefreshed'])).not.toBeDefined()
          const newState = geography(initialState, {
            type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
            states: [],
            selectedCountryId,
            lastRefreshed: now
          })

          expect(newState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'loading'])).toBe()
          expect(newState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'lastRefreshed'])).toEqual(now)
        })

        describe('with shallow states list', () => {
          it('should update the items of the selected country to a list of LazyLoadParents', () => {
            const statesReceived = [{ id: 1, name: 'Eastern Cape' },
              { id: 2, name: 'Gauteng' },
              { id: 3, name: 'Western Cape' }]
            const stateIds = _.map(statesReceived, 'id')
            const stateNames = _.map(statesReceived, 'name')
            const newState = geography(initialState, {
              type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
              states: statesReceived,
              selectedCountryId,
              lastRefreshed: now
            })
            const selectedCountryStates = newState.getIn(['countriesForLocationSelector', 'items', indexOfSelectedCountry, 'children', 'items'])

            expect(selectedCountryStates).toBeInstanceOf(Immutable.List)
            expect(selectedCountryStates.size).toEqual(statesReceived.length)
            selectedCountryStates.forEach((stateRecord) => {
              expect(stateIds).toContain(stateRecord.id)
              expect(stateNames).toContain(stateRecord.name)
              expect(stateRecord.children).toBeInstanceOf(Immutable.Record)
              expect(stateRecord.children.loading).toBe()
              expect(stateRecord.children.items.isEmpty()).toBe(true)
              expect(stateRecord.children.lastRefreshed).not.toBeDefined()
            })
          })
        })

        describe('with deep states list', () => {
          it('should update the items of the selected country to a list of LazyLoadParents', () => {
            const statesReceived = [{ id: 1, name: 'Eastern Cape' }, {
              id: 2,
              name: 'Gauteng',
              lgas: [{ id: 1, name: 'Midrand' },
                  { id: 2, name: 'Pretoria' },
                  { id: 3, name: 'Randburg' }]
            }, { id: 3, name: 'Western Cape' }]
            const stateIds = _.map(statesReceived, 'id')
            const stateNames = _.map(statesReceived, 'name')
            const newState = geography(initialState, {
              type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
              states: statesReceived,
              selectedCountryId,
              lastRefreshed: now
            })
            const selectedCountryStates = newState.getIn(['countriesForLocationSelector', 'items', indexOfSelectedCountry, 'children', 'items'])

            expect(selectedCountryStates).toBeInstanceOf(Immutable.List)
            expect(selectedCountryStates.size).toEqual(statesReceived.length)
            selectedCountryStates.forEach((stateRecord) => {
              expect(stateIds).toContain(stateRecord.id)
              expect(stateNames).toContain(stateRecord.name)
              expect(stateRecord.children).toBeInstanceOf(Immutable.Record)
              expect(stateRecord.children.loading).toBe()
              const stateReceived = _.find(statesReceived, { id: stateRecord.id })
              if (stateReceived.lgas) {
                const lgaIds = _.map(stateReceived.lgas, 'id')
                const lgaNames = _.map(stateReceived.lgas, 'name')
                expect(stateRecord.children.items).toBeInstanceOf(Immutable.List)
                expect(stateRecord.children.lastRefreshed).toEqual(now)
                stateRecord.children.items.forEach((lgaRecord) => {
                  expect(lgaIds).toContain(lgaRecord.id)
                  expect(lgaNames).toContain(lgaRecord.name)
                })
              } else {
                expect(stateRecord.children.items.isEmpty()).toBe(true)
                expect(stateRecord.children.lastRefreshed).not.toBeDefined()
              }
            })
          })
        })
      })
    })

    describe('REQUEST_LGAS_FOR_LOCATION_SELECTOR', () => {
      describe('when countries haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const initialState = geography(undefined, {})
          const newState = geography(initialState, {
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1,
            selectedStateId: 1
          })

          expect(initialState).toEqual(newState)
        })
      })

      describe('when states for the selected country haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const now = new Date()
          const countriesReceived = [{ id: 1, name: 'South Africa' }, { id: 2, name: 'United States' }]
          const stateWithCountriesLoaded = geography(undefined, {
            type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
            countries: countriesReceived,
            lastRefreshed: now
          })
          expect(
            stateWithCountriesLoaded.getIn(['countriesForLocationSelector', 'items']).size
          ).toEqual(2)
          const newState = geography(stateWithCountriesLoaded, {
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1,
            selectedStateId: 1
          })
          expect(stateWithCountriesLoaded).toEqual(newState)
        })
      })

      describe('when states for the selected country have been loaded', () => {
        it('should show that states for selected country are busy loading', () => {
          const now = new Date()
          const selectedCountryId = 1
          const selectedStateId = 2
          const countriesReceived = [{
            id: 1,
            name: 'South Africa',
            states: [{ id: 1, name: 'Eastern Cape' },
              { id: 2, name: 'Gauteng' },
              { id: 3, name: 'Western Cape' }]
          }, { id: 2, name: 'United States' }]
          const stateWithCountriesAndStatesLoaded = geography(undefined, {
            type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
            countries: countriesReceived,
            lastRefreshed: now
          })
          const newState = geography(stateWithCountriesAndStatesLoaded, {
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId,
            selectedStateId
          })
          const selectedCountry = newState.countriesForLocationSelector.items
            .find(country => country.id === selectedCountryId)
          const selectedState = selectedCountry.children.items
            .find(state => state.id === selectedStateId)

          expect(selectedState.children.loading).toBe(true)
        })
      })
    })

    describe('RECEIVE_LGAS_FOR_LOCATION_SELECTOR', () => {
      describe('when countries haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const initialState = geography(undefined, {})
          const newState = geography(initialState, {
            type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
            states: [{ id: 1, name: 'Eastern Cape' },
              { id: 2, name: 'Gauteng' },
              { id: 3, name: 'Western Cape' }],
            selectedCountryId: 1,
            selectedStateId: 2
          })

          expect(initialState).toEqual(newState)
        })
      })

      describe('when states for the selected country haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const now = new Date()
          const countriesReceived = [{ id: 1, name: 'South Africa' }, { id: 2, name: 'United States' }]
          const stateWithCountriesLoaded = geography(undefined, {
            type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
            countries: countriesReceived,
            lastRefreshed: now
          })
          const newState = geography(stateWithCountriesLoaded, {
            type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
            states: [{ id: 1, name: 'Eastern Cape' },
              { id: 2, name: 'Gauteng' },
              { id: 3, name: 'Western Cape' }],
            selectedCountryId: 1,
            selectedStateId: 2
          })

          expect(stateWithCountriesLoaded).toEqual(newState)
        })
      })

      describe('when states for the selected country have been loaded', () => {
        let initialState
        const countries = [{
          id: 1,
          name: 'South Africa',
          states: [{ id: 1, name: 'Eastern Cape' },
            { id: 2, name: 'Gauteng' },
            { id: 3, name: 'Western Cape' }]
        }, { id: 2, name: 'United States' }]
        const now = new Date()
        const selectedCountryId = 1
        let selectedCountry = null
        let indexOfSelectedCountry = -1
        const selectedStateId = 2
        let selectedState = null
        let indexOfSelectedState = -1

        beforeEach(() => {
          initialState = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
            countries,
            lastRefreshed: now
          })
          selectedCountry = initialState.countriesForLocationSelector.items
            .find(country => country.id === selectedCountryId)
          indexOfSelectedCountry = initialState.countriesForLocationSelector.items
            .indexOf(selectedCountry)
          selectedState = selectedCountry.children.items
            .find(state => state.id === selectedStateId)
          indexOfSelectedState = selectedCountry.children.items.indexOf(selectedState)
          initialState = geography(initialState, {
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId,
            selectedStateId
          })
        })

        it('should show that LGAs for the selected state are not loading anymore and update the last refreshed date', () => {
          expect(initialState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'items', indexOfSelectedState, 'children',
            'loading'])).toBe(true)
          expect(initialState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'items', indexOfSelectedState, 'children',
            'lastRefreshed'])).not.toBeDefined()
          const newState = geography(initialState, { type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
            lgas: [],
            selectedCountryId,
            selectedStateId,
            lastRefreshed: now
          })

          expect(newState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'items', indexOfSelectedState, 'children',
            'loading'])).toBe()
          expect(newState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'items', indexOfSelectedState, 'children',
            'lastRefreshed'])).toEqual(now)
        })

        it('should update the items of the selected country to a list of LazyLoadParents', () => {
          const lgasReceived = [{ id: 1, name: 'Eastern Cape' },
              { id: 2, name: 'Gauteng' },
              { id: 3, name: 'Western Cape' }]
          const lgaIds = _.map(lgasReceived, 'id')
          const lgaNames = _.map(lgasReceived, 'name')
          const newState = geography(initialState, { type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
            lgas: lgasReceived,
            selectedCountryId,
            selectedStateId,
            lastRefreshed: now
          })
          const selectedStateLgas = newState.getIn(['countriesForLocationSelector', 'items', indexOfSelectedCountry,
            'children', 'items', indexOfSelectedState, 'children', 'items'])

          expect(selectedStateLgas).toBeInstanceOf(Immutable.List)
          expect(selectedStateLgas.size).toEqual(lgasReceived.length)
          selectedStateLgas.forEach((lgaRecord) => {
            expect(lgaIds).toContain(lgaRecord.id)
            expect(lgaNames).toContain(lgaRecord.name)
          })
        })
      })
    })
  })
})

describe('geography action creators', () => {
  const fiveMinutes = 5 * 60 * 1000 // five minutes

  let clock
  let now
  let geographyRedux
  let dispatch
  let freshCacheTime
  let expiredCacheTime
  let countriesState = new LazyLoadItems({
    loading: false,
    items: Immutable.List(),
    lastRefreshed: undefined
  })

  function createGeographyReduxWithStubs(fetchStub) {
    const proxyDependencies = {
      '../shared/utils/fetch': fetchStub
    }
    geographyRedux = proxyquire('./GeographyRedux', proxyDependencies)
  }

  function createCountriesStateWith(countries, lastRefreshed) {
    return countriesState.set('items', new Immutable.List(_.map(countries, country => new LazyLoadParent({
      id: country.id,
      name: country.name,
      children: new LazyLoadItems({
        loading: false,
        lastRefreshed: country.states ? lastRefreshed : undefined,
        items: country.states ? new Immutable.List(_.map(country.states, state =>
          new LazyLoadParent({
            id: state.id,
            name: state.name,
            children: new LazyLoadItems({
              loading: false,
              lastRefreshed: state.lgas ? lastRefreshed : undefined,
              items: state.lgas ? new Immutable.List(_.map(state.lgas, lga =>
                new LazyLoadChild(lga))) : undefined
            })
          })
        )) : undefined
      })
    })))).set('lastRefreshed', lastRefreshed)
  }

  function setLastRefreshedTimeOnCountries(lastRefreshed) {
    return countriesState.set('lastRefreshed', lastRefreshed)
  }

  function setLastRefreshedTimeOnCountryStates(countryIndex, lastRefreshed) {
    return countriesState.setIn(['items', countryIndex, 'children', 'lastRefreshed'], lastRefreshed)
  }

  function setLastRefreshedTimeOnStateLGAs(countryIndex, stateIndex, lastRefreshed) {
    return countriesState.setIn(['items', countryIndex, 'children', 'items', stateIndex, 'children', 'lastRefreshed'], lastRefreshed)
  }

  function getCountryAt(index) {
    return countriesState.getIn(['items', index])
  }

  function getStateAt(countryIndex, stateIndex) {
    return countriesState.getIn(['items', countryIndex, 'children', 'items', stateIndex])
  }

  before(() => {
    now = new Date()
    clock = sinon.useFakeTimers(now.getTime())
    freshCacheTime = new Date(now - (fiveMinutes - 1))
    expiredCacheTime = new Date(now - fiveMinutes - 1)
  })

  after(() => {
    clock.restore()
  })

  describe('fetchCountriesForLocationSelector', () => {
    describe('when force refresh is false', () => {
      describe('and the countries cache is still fresh', () => {
        beforeEach(() => {
          dispatch = sinon.spy()
          geographyRedux = require('./GeographyRedux')
          countriesState = setLastRefreshedTimeOnCountries(freshCacheTime)
        })

        it('Should return a dispatch function that dispatches nothing', () => {
          const dispatchFunction = geographyRedux
            .fetchCountriesForLocationSelector(false, countriesState)
          dispatchFunction(dispatch)
          expect(dispatch.notCalled).toBe(true)
        })
      })

      describe('and the countries cache has expired', () => {
        const expectedCountriesToDispatch = ['List of countries']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedCountriesToDispatch
        })
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/geography/country-select-list')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          countriesState = setLastRefreshedTimeOnCountries(expiredCacheTime)
          const dispatchFunction = geographyRedux
            .fetchCountriesForLocationSelector(false, countriesState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{
            type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR
          }])
        })

        it('Should request a new list of countries from the server', () => {
          expect(fetchStub.aspectFetch.calledWith('/geography/country-select-list')).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR action with the countries received and the current date', () => expectedResponseFromServer.then((response) => {
            expect(response).toEqual({ ok: true, data: expectedCountriesToDispatch })
            expect(dispatch.secondCall.args).toEqual([{
              type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: expectedCountriesToDispatch,
              lastRefreshed: now }])
          }))
        })
      })

      describe('and the countries cache has not been loaded yet', () => {
        const expectedCountriesToDispatch = ['List of countries']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedCountriesToDispatch
        })
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/geography/country-select-list')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          countriesState = setLastRefreshedTimeOnCountries(undefined)
          const dispatchFunction = geographyRedux
            .fetchCountriesForLocationSelector(false, countriesState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{ type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR }])
        })

        it('Should request a new list of countries from the server', () => {
          expect(fetchStub.aspectFetch.calledWith('/geography/country-select-list')).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR action with the countries received and the current date', () => expectedResponseFromServer.then((response) => {
            expect(response).toEqual({ ok: true, data: expectedCountriesToDispatch })
            expect(dispatch.secondCall.args).toEqual([{
              type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: expectedCountriesToDispatch,
              lastRefreshed: now }])
          }))
        })
      })
    })

    describe('when force refresh is true', () => {
      describe('and the countries cache is still fresh', () => {
        const expectedCountriesToDispatch = ['List of countries']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedCountriesToDispatch
        })
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/geography/country-select-list')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          countriesState = setLastRefreshedTimeOnCountries(freshCacheTime)
          const dispatchFunction = geographyRedux
            .fetchCountriesForLocationSelector(true, countriesState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{ type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR }])
        })

        it('Should request a new list of countries from the server', () => {
          expect(fetchStub.aspectFetch.calledWith('/geography/country-select-list')).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR action with the countries received and the current date', () => expectedResponseFromServer.then((response) => {
            expect(response).toEqual({ ok: true, data: expectedCountriesToDispatch })
            expect(dispatch.secondCall.args).toEqual([{
              type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: expectedCountriesToDispatch,
              lastRefreshed: now }])
          }))
        })
      })

      describe('and the countries cache has expired', () => {
        const expectedCountriesToDispatch = ['List of countries']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedCountriesToDispatch
        })
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/geography/country-select-list')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          countriesState = setLastRefreshedTimeOnCountries(expiredCacheTime)
          const dispatchFunction = geographyRedux
            .fetchCountriesForLocationSelector(true, countriesState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{ type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR }])
        })

        it('Should request a new list of countries from the server', () => {
          expect(fetchStub.aspectFetch.calledWith('/geography/country-select-list')).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR action with the countries received and the current date', () => expectedResponseFromServer.then((response) => {
            expect(response).toEqual({ ok: true, data: expectedCountriesToDispatch })
            expect(dispatch.secondCall.args).toEqual([{
              type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: expectedCountriesToDispatch,
              lastRefreshed: now }])
          }))
        })
      })

      describe('and the countries cache has not been loaded yet', () => {
        const expectedCountriesToDispatch = ['List of countries']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedCountriesToDispatch
        })
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/geography/country-select-list')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          countriesState = setLastRefreshedTimeOnCountries(undefined)
          const dispatchFunction = geographyRedux
            .fetchCountriesForLocationSelector(true, countriesState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{ type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR }])
        })

        it('Should request a new list of countries from the server', () => {
          expect(fetchStub.aspectFetch.calledWith('/geography/country-select-list')).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR action with the countries received and the current date', () => expectedResponseFromServer.then((response) => {
            expect(response).toEqual({ ok: true, data: expectedCountriesToDispatch })
            expect(dispatch.secondCall.args).toEqual([{
              type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: expectedCountriesToDispatch,
              lastRefreshed: now }])
          }))
        })
      })
    })

    describe('when selected country is specified', () => {
      describe('and the countries cache has not been loaded yet', () => {
        const expectedCountriesToDispatch = ['List of countries']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedCountriesToDispatch
        })
        const selectedCountryId = 2
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs(`/geography/country-select-list/${selectedCountryId}`)
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          const dispatchFunction = geographyRedux
            .fetchCountriesForLocationSelector(false, countriesState, selectedCountryId)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{ type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR }])
        })

        it('Should request a new list of countries from the server', () => {
          expect(
            fetchStub.aspectFetch.calledWith(`/geography/country-select-list/${selectedCountryId}`)
          ).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR action with the countries received and the current date', () => expectedResponseFromServer.then((response) => {
            expect(response).toEqual({ ok: true, data: expectedCountriesToDispatch })
            expect(dispatch.secondCall.args).toEqual([{
              type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: expectedCountriesToDispatch,
              lastRefreshed: now }])
          }))
        })
      })
    })

    describe('when selected country and state are specified', () => {
      describe('and the countries cache has not been loaded yet', () => {
        const expectedCountriesToDispatch = ['List of countries']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedCountriesToDispatch
        })
        const selectedCountryId = 1
        const selectedStateId = 2
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs(`/geography/country-select-list/${selectedCountryId}/${selectedStateId}`)
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          const dispatchFunction = geographyRedux
            .fetchCountriesForLocationSelector(false, countriesState,
              selectedCountryId, selectedStateId)

          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{ type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR }])
        })

        it('Should request a new list of countries from the server', () => {
          expect(
            fetchStub.aspectFetch.calledWith(`/geography/country-select-list/${selectedCountryId}/${selectedStateId}`)
          ).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR action with the countries received and the current date', () => expectedResponseFromServer.then((response) => {
            expect(response).toEqual({ ok: true, data: expectedCountriesToDispatch })
            expect(dispatch.secondCall.args).toEqual([{
              type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: expectedCountriesToDispatch,
              lastRefreshed: now }])
          }))
        })
      })
    })
  })

  describe('fetchStatesForLocationSelector', () => {
    before(() => {
      countriesState = createCountriesStateWith([{ id: 1, name: 'South Africa' },
        { id: 2, name: 'United States' }], now)
    })

    describe('when force refresh is false', () => {
      describe('and the states cache for the selected country is still fresh', () => {
        beforeEach(() => {
          dispatch = sinon.spy()
          geographyRedux = require('./GeographyRedux')
          countriesState = setLastRefreshedTimeOnCountryStates(0, freshCacheTime)
        })

        it('Should return a dispatch function that dispatches nothing', () => {
          const selectedCountry = getCountryAt(0)
          const dispatchFunction = geographyRedux.fetchStatesForLocationSelector(false,
            selectedCountry)
          dispatchFunction(dispatch)
          expect(dispatch.notCalled).toBe(true)
        })
      })

      describe('and the states cache for the selected country has expired', () => {
        const expectedStatesToDispatch = ['List of states']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedStatesToDispatch
        })
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/geography/state-select-list/1')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          countriesState = setLastRefreshedTimeOnCountryStates(0, expiredCacheTime)
          const selectedCountry = getCountryAt(0)
          const dispatchFunction = geographyRedux
            .fetchStatesForLocationSelector(false, selectedCountry)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_STATES_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{
            type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1
          }])
        })

        it('Should request a new list of states from the server', () => {
          expect(fetchStub.aspectFetch.calledWith('/geography/state-select-list/1')).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_STATES_FOR_LOCATION_SELECTOR action with the states received and the current date', () => expectedResponseFromServer.then((response) => {
            expect(response).toEqual({ ok: true, data: expectedStatesToDispatch })
            expect(dispatch.secondCall.args).toEqual([{
              type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
              states: expectedStatesToDispatch,
              selectedCountryId: 1,
              lastRefreshed: now }])
          }))
        })
      })

      describe('and the states cache for the selected country cache has not been loaded yet', () => {
        const expectedStatesToDispatch = ['List of states']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedStatesToDispatch
        })
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/geography/state-select-list/1')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          countriesState = setLastRefreshedTimeOnCountryStates(0, undefined)
          const selectedCountry = getCountryAt(0)
          const dispatchFunction = geographyRedux
            .fetchStatesForLocationSelector(false, selectedCountry)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_STATES_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{
            type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1
          }])
        })

        it('Should request a new list of states from the server', () => {
          expect(fetchStub.aspectFetch.calledWith('/geography/state-select-list/1')).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_STATES_FOR_LOCATION_SELECTOR action with the states received and the current date', () => expectedResponseFromServer.then((response) => {
            expect(response).toEqual({ ok: true, data: expectedStatesToDispatch })
            expect(dispatch.secondCall.args).toEqual([{
              type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
              states: expectedStatesToDispatch,
              selectedCountryId: 1,
              lastRefreshed: now }])
          }))
        })
      })
    })

    describe('when force refresh is true', () => {
      describe('and the states cache for the selected country is still fresh', () => {
        const expectedStatesToDispatch = ['List of states']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedStatesToDispatch
        })
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/geography/state-select-list/1')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          countriesState = setLastRefreshedTimeOnCountryStates(0, freshCacheTime)
          const selectedCountry = getCountryAt(0)
          const dispatchFunction = geographyRedux
            .fetchStatesForLocationSelector(true, selectedCountry)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_STATES_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{
            type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1
          }])
        })

        it('Should request a new list of states from the server', () => {
          expect(fetchStub.aspectFetch.calledWith('/geography/state-select-list/1')).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_STATES_FOR_LOCATION_SELECTOR action with the states received and the current date', () => expectedResponseFromServer.then((response) => {
            expect(response).toEqual({ ok: true, data: expectedStatesToDispatch })
            expect(dispatch.secondCall.args).toEqual([{
              type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
              states: expectedStatesToDispatch,
              selectedCountryId: 1,
              lastRefreshed: now }])
          }))
        })
      })

      describe('and the states cache for the selected country has expired', () => {
        const expectedStatesToDispatch = ['List of states']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedStatesToDispatch
        })
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/geography/state-select-list/1')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          countriesState = setLastRefreshedTimeOnCountryStates(0, expiredCacheTime)
          const selectedCountry = getCountryAt(0)
          const dispatchFunction = geographyRedux
            .fetchStatesForLocationSelector(true, selectedCountry)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_STATES_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{
            type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1
          }])
        })

        it('Should request a new list of states from the server', () => {
          expect(fetchStub.aspectFetch.calledWith('/geography/state-select-list/1')).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_STATES_FOR_LOCATION_SELECTOR action with the states received and the current date', () => expectedResponseFromServer.then((response) => {
            expect(response).toEqual({ ok: true, data: expectedStatesToDispatch })
            expect(dispatch.secondCall.args).toEqual([{
              type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
              states: expectedStatesToDispatch,
              selectedCountryId: 1,
              lastRefreshed: now }])
          }))
        })
      })

      describe('and the states cache for the selected country cache has not been loaded yet', () => {
        const expectedStatesToDispatch = ['List of states']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedStatesToDispatch
        })
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/geography/state-select-list/1')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          countriesState = setLastRefreshedTimeOnCountryStates(0, undefined)
          const selectedCountry = getCountryAt(0)
          const dispatchFunction = geographyRedux
            .fetchStatesForLocationSelector(true, selectedCountry)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_STATES_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{
            type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1
          }])
        })

        it('Should request a new list of states from the server', () => {
          expect(fetchStub.aspectFetch.calledWith('/geography/state-select-list/1')).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_STATES_FOR_LOCATION_SELECTOR action with the states received and the current date', () => expectedResponseFromServer.then((response) => {
            expect(response).toEqual({ ok: true, data: expectedStatesToDispatch })
            expect(dispatch.secondCall.args).toEqual([{
              type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
              states: expectedStatesToDispatch,
              selectedCountryId: 1,
              lastRefreshed: now }])
          }))
        })
      })
    })
  })

  describe('fetchLgasForLocationSelector', () => {
    before(() => {
      countriesState = createCountriesStateWith([{
        id: 1,
        name: 'South Africa',
        states: [{ id: 1, name: 'Eastern Cape' },
          { id: 2, name: 'Gauteng' }]
      }, { id: 2, name: 'United States' }], now)
    })

    describe('when force refresh is false', () => {
      describe('and the LGAs cache for the selected state is still fresh', () => {
        beforeEach(() => {
          dispatch = sinon.spy()
          geographyRedux = require('./GeographyRedux')
          countriesState = setLastRefreshedTimeOnStateLGAs(0, 0, freshCacheTime)
        })

        it('Should return a dispatch function that dispatches nothing', () => {
          const selectedCountry = getCountryAt(0)
          const selectedState = getStateAt(0, 0)
          const dispatchFunction = geographyRedux
            .fetchLgasForLocationSelector(false, selectedCountry, selectedState)
          dispatchFunction(dispatch)
          expect(dispatch.notCalled).toBe(true)
        })
      })

      describe('and the LGAs cache for the selected state has expired', () => {
        const expectedLgasToDispatch = ['List of LGAs']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedLgasToDispatch
        })
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/geography/lga-select-list/1')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          countriesState = setLastRefreshedTimeOnStateLGAs(0, 0, expiredCacheTime)
          const selectedCountry = getCountryAt(0)
          const selectedState = getStateAt(0, 0)
          const dispatchFunction = geographyRedux
            .fetchLgasForLocationSelector(false, selectedCountry, selectedState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_LGAS_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1,
            selectedStateId: 1
          }])
        })

        it('Should request a new list of LGAs from the server', () => {
          expect(fetchStub.aspectFetch.calledWith('/geography/lga-select-list/1')).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_LGAS_FOR_LOCATION_SELECTOR action with the lgas received and the current date', () => expectedResponseFromServer.then((response) => {
            expect(response).toEqual({ ok: true, data: expectedLgasToDispatch })
            expect(dispatch.secondCall.args).toEqual([{
              type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
              lgas: expectedLgasToDispatch,
              selectedCountryId: 1,
              selectedStateId: 1,
              lastRefreshed: now }])
          }))
        })
      })

      describe('and the LGAs cache for the selected state cache has not been loaded yet', () => {
        const expectedLGAsToDispatch = ['List of LGAs']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedLGAsToDispatch
        })
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/geography/lga-select-list/1')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          countriesState = setLastRefreshedTimeOnStateLGAs(0, 0, undefined)
          const selectedCountry = getCountryAt(0)
          const selectedState = getStateAt(0, 0)
          const dispatchFunction = geographyRedux
              .fetchLgasForLocationSelector(false, selectedCountry, selectedState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_LGAS_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1,
            selectedStateId: 1
          }])
        })

        it('Should request a new list of LGAs from the server', () => {
          expect(fetchStub.aspectFetch.calledWith('/geography/lga-select-list/1')).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_LGAS_FOR_LOCATION_SELECTOR action with the LGAs received and the current date', () => expectedResponseFromServer.then((response) => {
            expect(response).toEqual({ ok: true, data: expectedLGAsToDispatch })
            expect(dispatch.secondCall.args).toEqual([{
              type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
              lgas: expectedLGAsToDispatch,
              selectedCountryId: 1,
              selectedStateId: 1,
              lastRefreshed: now }])
          }))
        })
      })
    })

    describe('when force refresh is true', () => {
      describe('and the LGAs cache for the selected state is still fresh', () => {
        const expectedLgasToDispatch = ['List of LGAs']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedLgasToDispatch
        })
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/geography/lga-select-list/1')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          countriesState = setLastRefreshedTimeOnStateLGAs(0, 0, freshCacheTime)
          const selectedCountry = getCountryAt(0)
          const selectedState = getStateAt(0, 0)
          const dispatchFunction = geographyRedux
            .fetchLgasForLocationSelector(true, selectedCountry, selectedState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_LGAS_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1,
            selectedStateId: 1
          }])
        })

        it('Should request a new list of LGAs from the server', () => {
          expect(fetchStub.aspectFetch.calledWith('/geography/lga-select-list/1')).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_LGAS_FOR_LOCATION_SELECTOR action with the LGAs received and the current date', () => expectedResponseFromServer.then((response) => {
            expect(response).toEqual({ ok: true, data: expectedLgasToDispatch })
            expect(dispatch.secondCall.args).toEqual([{
              type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
              lgas: expectedLgasToDispatch,
              selectedCountryId: 1,
              selectedStateId: 1,
              lastRefreshed: now }])
          }))
        })
      })

      describe('and the LGAs cache for the selected state has expired', () => {
        const expectedLgasToDispatch = ['List of LGAs']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedLgasToDispatch
        })
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/geography/lga-select-list/1')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          countriesState = setLastRefreshedTimeOnStateLGAs(0, 0, expiredCacheTime)
          const selectedCountry = getCountryAt(0)
          const selectedState = getStateAt(0, 0)
          const dispatchFunction = geographyRedux
            .fetchLgasForLocationSelector(true, selectedCountry, selectedState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_LGAS_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1,
            selectedStateId: 1
          }])
        })

        it('Should request a new list of LGAs from the server', () => {
          expect(fetchStub.aspectFetch.calledWith('/geography/lga-select-list/1')).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_LGAS_FOR_LOCATION_SELECTOR action with the LGAs received and the current date', () => expectedResponseFromServer.then((response) => {
            expect(response).toEqual({ ok: true, data: expectedLgasToDispatch })
            expect(dispatch.secondCall.args).toEqual([{
              type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
              lgas: expectedLgasToDispatch,
              selectedCountryId: 1,
              selectedStateId: 1,
              lastRefreshed: now }])
          }))
        })
      })

      describe('and the LGAs cache for the selected state cache has not been loaded yet', () => {
        const expectedLgasToDispatch = ['List of LGAs']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedLgasToDispatch
        })
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/geography/lga-select-list/1')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          countriesState = setLastRefreshedTimeOnStateLGAs(0, 0, undefined)
          const selectedCountry = getCountryAt(0)
          const selectedState = getStateAt(0, 0)
          const dispatchFunction = geographyRedux
            .fetchLgasForLocationSelector(true, selectedCountry, selectedState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_LGAS_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1,
            selectedStateId: 1
          }])
        })

        it('Should request a new list of LGAs from the server', () => {
          expect(fetchStub.aspectFetch.calledWith('/geography/lga-select-list/1')).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_LGAS_FOR_LOCATION_SELECTOR action with the LGAs received and the current date', () => expectedResponseFromServer.then((response) => {
            expect(response).toEqual({ ok: true, data: expectedLgasToDispatch })
            expect(dispatch.secondCall.args).toEqual([{
              type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
              lgas: expectedLgasToDispatch,
              selectedCountryId: 1,
              selectedStateId: 1,
              lastRefreshed: now }])
          }))
        })
      })
    })
  })
})
