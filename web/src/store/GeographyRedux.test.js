import Immutable from 'immutable'
import find from 'lodash/find'
import map from 'lodash/map'
import sinon from 'sinon'
import geography, { types, LazyLoadItems } from './GeographyRedux'

describe('geography reducer', () => {
  describe('initial state', () => {
    let initialState

    beforeEach(() => {
      initialState = geography(undefined, {})
    })

    it("should contain an empty LazyLoadItems object that isn't loading and has not been refreshed yet", () => {
      expect(initialState.countriesForLocationSelector).toBeInstanceOf(Immutable.Record)
      expect(initialState.countriesForLocationSelector.loading).toBe(false)
      expect(initialState.countriesForLocationSelector.lastRefreshed).not.toBeDefined()
      expect(initialState.countriesForLocationSelector.items).toBeInstanceOf(Immutable.List)
      expect(initialState.countriesForLocationSelector.items.size).toEqual(0)
    })
  })

  describe('actions', () => {
    describe('REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR', () => {
      it('should show that countries are busy loading', () => {
        const state = geography(undefined, {
          type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR,
        })
        expect(state.countriesForLocationSelector.loading).toBe(true)
      })
    })

    describe('RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR', () => {
      it('should show that countries are not loading anymore and update the last refreshed date', () => {
        const now = new Date()
        const state = geography(undefined, {
          type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
          countries: [],
          lastRefreshed: now,
        })
        expect(state.countriesForLocationSelector.loading).toBe(false)
        expect(state.countriesForLocationSelector.lastRefreshed).toEqual(now)
      })

      describe('with shallow country list', () => {
        it('should update the items to a list of LazyLoadParents', () => {
          const now = new Date()
          const countriesReceived = [
            { id: 1, name: 'South Africa' },
            { id: 2, name: 'United States' },
          ]
          const state = geography(undefined, {
            type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
            countries: countriesReceived,
            lastRefreshed: now,
          })
          const countryIds = map(countriesReceived, 'id')
          const countryNames = map(countriesReceived, 'name')

          expect(state.countriesForLocationSelector.items).toBeInstanceOf(Immutable.List)
          state.countriesForLocationSelector.items.forEach(countryRecord => {
            expect(countryIds).toContain(countryRecord.id)
            expect(countryNames).toContain(countryRecord.name)
            expect(countryRecord.children).toBeInstanceOf(Immutable.Record)
            expect(countryRecord.children.loading).toBe(false)
            expect(countryRecord.children.items.isEmpty()).toBe(true)
            expect(countryRecord.children.lastRefreshed).not.toBeDefined()
          })
        })
      })

      describe('with deep country list', () => {
        it('should update the items to a list of LazyLoadParents and populate the state and lga children', () => {
          const now = new Date()
          const countriesReceived = [
            {
              id: 1,
              name: 'South Africa',
              states: [
                { id: 1, name: 'Eastern Cape' },
                {
                  id: 2,
                  name: 'Gauteng',
                  lgas: [
                    { id: 1, name: 'Midrand' },
                    { id: 2, name: 'Pretoria' },
                    { id: 3, name: 'Randburg' },
                  ],
                },
                { id: 3, name: 'Western Cape' },
              ],
            },
            { id: 2, name: 'United States' },
          ]
          const state = geography(undefined, {
            type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
            countries: countriesReceived,
            lastRefreshed: now,
          })
          const countryIds = map(countriesReceived, 'id')
          const countryNames = map(countriesReceived, 'name')

          expect(state.countriesForLocationSelector.items).toBeInstanceOf(Immutable.List)
          state.countriesForLocationSelector.items.forEach(countryRecord => {
            expect(countryIds).toContain(countryRecord.id)
            expect(countryNames).toContain(countryRecord.name)
            expect(countryRecord.children).toBeInstanceOf(Immutable.Record)
            expect(countryRecord.children.loading).toBe(false)
            const countryReceived = find(countriesReceived, {
              id: countryRecord.id,
            })
            if (countryReceived.states) {
              const stateIds = map(countryReceived.states, 'id')
              const stateNames = map(countryReceived.states, 'name')
              expect(countryRecord.children.items).toBeInstanceOf(Immutable.List)
              expect(countryRecord.children.lastRefreshed).toEqual(now)
              countryRecord.children.items.forEach(stateRecord => {
                expect(stateIds).toContain(stateRecord.id)
                expect(stateNames).toContain(stateRecord.name)
                expect(stateRecord.children).toBeInstanceOf(Immutable.Record)
                expect(stateRecord.children.loading).toBe(false)
                const stateReceived = find(countryReceived.states, {
                  id: stateRecord.id,
                })
                if (stateReceived.lgas) {
                  const lgaIds = map(stateReceived.lgas, 'id')
                  const lgaNames = map(stateReceived.lgas, 'name')
                  expect(stateRecord.children.items).toBeInstanceOf(Immutable.List)
                  expect(stateRecord.children.lastRefreshed).toEqual(now)
                  stateRecord.children.items.forEach(lgaRecord => {
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
      describe("when countries haven't been loaded yet", () => {
        it('should not change state', () => {
          const initialState = geography(undefined, {})
          const newState = geography(initialState, {
            type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1,
          })

          expect(initialState).toEqual(newState)
        })
      })
    })

    describe('REQUEST_LGAS_FOR_LOCATION_SELECTOR', () => {
      describe("when states for the selected country haven't been loaded yet", () => {
        it('should not change state', () => {
          const now = new Date()
          const countriesReceived = [
            { id: 1, name: 'South Africa' },
            { id: 2, name: 'United States' },
          ]
          const stateWithCountriesLoaded = geography(undefined, {
            type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
            countries: countriesReceived,
            lastRefreshed: now,
          })
          expect(stateWithCountriesLoaded.getIn(['countriesForLocationSelector', 'items']).size).toEqual(2)
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
    lastRefreshed: undefined,
  })

  function createGeographyReduxWithStubs(fetchStub) {
    jest.resetModules().mock('../utils/utils/fetch', () => fetchStub)

    geographyRedux = require('./GeographyRedux')
  }

  function setLastRefreshedTimeOnCountries(lastRefreshed) {
    return countriesState.set('lastRefreshed', lastRefreshed)
  }

  beforeAll(() => {
    now = new Date()
    clock = sinon.useFakeTimers(now.getTime())
    freshCacheTime = new Date(now - (fiveMinutes - 1))
    expiredCacheTime = new Date(now - fiveMinutes - 1)
  })

  afterAll(() => {
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
          const dispatchFunction = geographyRedux.fetchCountriesForLocationSelector(countriesState)
          dispatchFunction(dispatch)
          expect(dispatch.notCalled).toBe(true)
        })
      })

      describe('and the countries cache has expired', () => {
        const expectedCountriesToDispatch = ['List of countries']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedCountriesToDispatch,
        })
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub(),
          }
          fetchStub.aspectFetch.withArgs('/geography/country-select-list').returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          countriesState = setLastRefreshedTimeOnCountries(expiredCacheTime)
          const dispatchFunction = geographyRedux.fetchCountriesForLocationSelector(countriesState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([
            {
              type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR,
            },
          ])
        })

        it('Should request a new list of countries from the server', () => {
          expect(fetchStub.aspectFetch.calledWith('/geography/country-select-list')).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR action with the countries received and the current date', () =>
            expectedResponseFromServer.then(response => {
              expect(response).toEqual({
                ok: true,
                data: expectedCountriesToDispatch,
              })
              expect(dispatch.secondCall.args).toEqual([
                {
                  type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
                  countries: expectedCountriesToDispatch,
                  lastRefreshed: now,
                },
              ])
            }))
        })
      })

      describe('and the countries cache has not been loaded yet', () => {
        const expectedCountriesToDispatch = ['List of countries']
        const expectedResponseFromServer = Promise.resolve({
          ok: true,
          data: expectedCountriesToDispatch,
        })
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub(),
          }
          fetchStub.aspectFetch.withArgs('/geography/country-select-list').returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          countriesState = setLastRefreshedTimeOnCountries(undefined)
          const dispatchFunction = geographyRedux.fetchCountriesForLocationSelector(countriesState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR action', () => {
          expect(dispatch.firstCall.args).toEqual([{ type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR }])
        })

        it('Should request a new list of countries from the server', () => {
          expect(fetchStub.aspectFetch.calledWith('/geography/country-select-list')).toBeTruthy()
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR action with the countries received and the current date', () =>
            expectedResponseFromServer.then(response => {
              expect(response).toEqual({
                ok: true,
                data: expectedCountriesToDispatch,
              })
              expect(dispatch.secondCall.args).toEqual([
                {
                  type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
                  countries: expectedCountriesToDispatch,
                  lastRefreshed: now,
                },
              ])
            }))
        })
      })
    })
  })
})
