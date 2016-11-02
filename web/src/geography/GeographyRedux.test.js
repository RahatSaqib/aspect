import { assert } from 'chai'
import Immutable from 'immutable'
import _ from 'lodash'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import geography, {types} from './GeographyRedux'

describe('geography reducer', () => {
  describe('initial state', () => {
    let initialState

    beforeEach(()=>{
      initialState = geography(undefined, {})
    })

    it('should contain an empty LazyLoadItems object that isn\'t loading and has not been refreshed yet', () => {
      assert.instanceOf(initialState.countriesForLocationSelector, Immutable.Record)
      assert.isFalse(initialState.countriesForLocationSelector.loading)
      assert.isUndefined(initialState.countriesForLocationSelector.lastRefreshed)
      assert.instanceOf(initialState.countriesForLocationSelector.items, Immutable.List)
      assert.equal(initialState.countriesForLocationSelector.items.size, 0)
    })
  })

  describe('actions', () => {
    describe('REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR', () => {
      it('should show that countries are busy loading', () => {
        const state = geography(undefined, { type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR })
        assert.isTrue(state.countriesForLocationSelector.loading)
      })
    })

    describe('RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR', () => {
      it('should show that countries are not loading anymore and update the last refreshed date', () => {
        const now = new Date(),
          state = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
            countries: [],
            lastRefreshed: now
          })
        assert.isFalse(state.countriesForLocationSelector.loading)
        assert.equal(state.countriesForLocationSelector.lastRefreshed, now)
      })

      describe('with shallow country list', () => {
        it('should update the items to a list of LazyLoadParents', () => {
          const now = new Date(),
            countriesReceived = [{id: 1, name: 'South Africa'}, {id: 2, name: 'United Sates'}],
            state = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: countriesReceived,
              lastRefreshed: now
            }), countryIds = _.map(countriesReceived, 'id'),
            countryNames = _.map(countriesReceived, 'name')

          assert.instanceOf(state.countriesForLocationSelector.items, Immutable.List)
          state.countriesForLocationSelector.items.forEach(countryRecord => {
            assert.include(countryIds, countryRecord.id)
            assert.include(countryNames, countryRecord.name)
            assert.instanceOf(countryRecord.children, Immutable.Record)
            assert.isFalse(countryRecord.children.loading)
            assert.isUndefined(countryRecord.children.items)
            assert.isUndefined(countryRecord.children.lastRefreshed)
          })
        })
      })

      describe('with deep country list', () => {
        it('should update the items to a list of LazyLoadParents and populate the state and lga children', () => {
          const now = new Date(),
            countriesReceived = [{
              id: 1,
              name: 'South Africa',
              states: [{id: 1, name: 'Eastern Cape'},
                {
                  id: 2,
                  name: 'Gauteng',
                  lgas: [{id: 1, name: 'Midrand'},
                    {id: 2, name: 'Pretoria'},
                    {id: 3, name: 'Randburg'}]
                }, {id: 3, name: 'Western Cape'}]},
              {id: 2, name: 'United Sates'}],
            state = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: countriesReceived,
              lastRefreshed: now
            }), countryIds = _.map(countriesReceived, 'id'),
            countryNames = _.map(countriesReceived, 'name')

          assert.instanceOf(state.countriesForLocationSelector.items, Immutable.List)
          state.countriesForLocationSelector.items.forEach(countryRecord => {
            assert.include(countryIds, countryRecord.id)
            assert.include(countryNames, countryRecord.name)
            assert.instanceOf(countryRecord.children, Immutable.Record)
            assert.isFalse(countryRecord.children.loading)
            const countryReceived = _.find(countriesReceived, {id: countryRecord.id})
            if(countryReceived.states) {
              const stateIds = _.map(countryReceived.states, 'id'),
                stateNames = _.map(countryReceived.states, 'name')
              assert.instanceOf(countryRecord.children.items, Immutable.List)
              assert.equal(countryRecord.children.lastRefreshed, now)
              countryRecord.children.items.forEach(stateRecord => {
                assert.include(stateIds, stateRecord.id)
                assert.include(stateNames, stateRecord.name)
                assert.instanceOf(stateRecord.children, Immutable.Record)
                assert.isFalse(stateRecord.children.loading)
                const stateReceived = _.find(countryReceived.states, {id: stateRecord.id})
                if(stateReceived.lgas) {
                  const lgaIds = _.map(stateReceived.lgas, 'id'),
                    lgaNames = _.map(stateReceived.lgas, 'name')
                  assert.instanceOf(stateRecord.children.items, Immutable.List)
                  assert.equal(stateRecord.children.lastRefreshed, now)
                  stateRecord.children.items.forEach(lgaRecord => {
                    assert.include(lgaIds, lgaRecord.id)
                    assert.include(lgaNames, lgaRecord.name)
                  })
                } else {
                  assert.isUndefined(stateRecord.children.items)
                  assert.isUndefined(stateRecord.children.lastRefreshed)
                }
              })
            } else {
              assert.isUndefined(countryRecord.children.items)
              assert.isUndefined(countryRecord.children.lastRefreshed)
            }
          })
        })
      })
    })

    describe('REQUEST_STATES_FOR_LOCATION_SELECTOR', () => {
      describe('when countries haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const initialState = geography(undefined, {}),
            newState = geography(initialState, {
              type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
              selectedCountryId: 1
            })

          assert.deepEqual(initialState, newState)
        })
      })

      describe('when countries have been loaded', () => {
        it('should show that states for selected country are busy loading', () => {
          const now = new Date(),
            selectedCountryId = 1,
            countriesReceived = [{id: 1, name: 'South Africa'}, {id: 2, name: 'United Sates'}],
            state = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: countriesReceived,
              lastRefreshed: now
            }), newState = geography(state, {
              type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
              selectedCountryId: selectedCountryId
            }), selectedCountry = newState.countriesForLocationSelector.items.find(val => val.id === selectedCountryId)

          assert.isTrue(selectedCountry.children.loading)
        })
      })
    })

    describe('RECEIVE_STATES_FOR_LOCATION_SELECTOR', () => {
      describe('when countries haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const initialState = geography(undefined, {}),
            newState = geography(initialState, {
              type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
              states: [{id: 1, name: 'Eastern Cape'},
                {id: 2, name: 'Gauteng'},
                {id: 3, name: 'Western Cape'}],
              selectedCountryId: 1
            })

          assert.deepEqual(initialState, newState)
        })
      })

      describe('when countries have been loaded', () => {
        let initialState, countries = [{id: 1, name: 'South Africa'}, {id: 2, name: 'United Sates'}],
          now = new Date(),
          selectedCountryId = 1,
          selectedCountry = null,
          indexOfSelectedCountry = -1

        beforeEach(() => {
          initialState = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
            countries: countries,
            lastRefreshed: now
          })
          selectedCountry = initialState.countriesForLocationSelector.items.find(country => country.id === selectedCountryId)
          indexOfSelectedCountry = initialState.countriesForLocationSelector.items.indexOf(selectedCountry)
          initialState = geography(initialState, {
            type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
            selectedCountryId: selectedCountryId
          })
        })

        it('should show that states for the selected country are not loading anymore and update the last refreshed date', () => {
          assert.isTrue(initialState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'loading']))
          assert.isUndefined(initialState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'lastRefreshed']))
          const newState = geography(initialState, { type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
            states: [],
            selectedCountryId: selectedCountryId,
            lastRefreshed: now
          })

          assert.isFalse(newState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'loading']))
          assert.equal(newState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'lastRefreshed']), now)
        })

        describe('with shallow states list', () => {
          it('should update the items of the selected country to a list of LazyLoadParents', () => {
            const statesReceived = [{id: 1, name: 'Eastern Cape'},
              {id: 2, name: 'Gauteng'},
              {id: 3, name: 'Western Cape'}],
              stateIds = _.map(statesReceived, 'id'),
              stateNames = _.map(statesReceived, 'name'),
              newState = geography(initialState, { type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
                states: statesReceived,
                selectedCountryId: selectedCountryId,
                lastRefreshed: now
              }), selectedCountryStates = newState.getIn(['countriesForLocationSelector', 'items', indexOfSelectedCountry, 'children', 'items'])

            assert.instanceOf(selectedCountryStates, Immutable.List)
            assert.equal(selectedCountryStates.size, statesReceived.length)
            selectedCountryStates.forEach(stateRecord => {
              assert.include(stateIds, stateRecord.id)
              assert.include(stateNames, stateRecord.name)
              assert.instanceOf(stateRecord.children, Immutable.Record)
              assert.isFalse(stateRecord.children.loading)
              assert.isUndefined(stateRecord.children.items)
              assert.isUndefined(stateRecord.children.lastRefreshed)
            })
          })
        })

        describe('with deep states list', () => {
          it('should update the items of the selected country to a list of LazyLoadParents', () => {
            const statesReceived = [{id: 1, name: 'Eastern Cape'}, {
                id: 2,
                name: 'Gauteng',
                lgas: [{id: 1, name: 'Midrand'},
                  {id: 2, name: 'Pretoria'},
                  {id: 3, name: 'Randburg'}]
              }, {id: 3, name: 'Western Cape'}],
              stateIds = _.map(statesReceived, 'id'),
              stateNames = _.map(statesReceived, 'name'),
              newState = geography(initialState, { type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
                states: statesReceived,
                selectedCountryId: selectedCountryId,
                lastRefreshed: now
              }), selectedCountryStates = newState.getIn(['countriesForLocationSelector', 'items', indexOfSelectedCountry, 'children', 'items'])

            assert.instanceOf(selectedCountryStates, Immutable.List)
            assert.equal(selectedCountryStates.size, statesReceived.length)
            selectedCountryStates.forEach(stateRecord => {
              assert.include(stateIds, stateRecord.id)
              assert.include(stateNames, stateRecord.name)
              assert.instanceOf(stateRecord.children, Immutable.Record)
              assert.isFalse(stateRecord.children.loading)
              const stateReceived = _.find(statesReceived, {id: stateRecord.id})
              if(stateReceived.lgas) {
                const lgaIds = _.map(stateReceived.lgas, 'id'),
                  lgaNames = _.map(stateReceived.lgas, 'name')
                assert.instanceOf(stateRecord.children.items, Immutable.List)
                assert.equal(stateRecord.children.lastRefreshed, now)
                stateRecord.children.items.forEach(lgaRecord => {
                  assert.include(lgaIds, lgaRecord.id)
                  assert.include(lgaNames, lgaRecord.name)
                })
              } else {
                assert.isUndefined(stateRecord.children.items)
                assert.isUndefined(stateRecord.children.lastRefreshed)
              }
            })
          })
        })
      })
    })

    describe('REQUEST_LGAS_FOR_LOCATION_SELECTOR', () => {
      describe('when countries haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const initialState = geography(undefined, {}),
            newState = geography(initialState, {
              type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
              selectedCountryId: 1,
              selectedStateId: 1
            })

          assert.deepEqual(initialState, newState)
        })
      })

      describe('when states for the selected country haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const now = new Date(),
            countriesReceived = [{id: 1, name: 'South Africa'}, {id: 2, name: 'United Sates'}],
            stateWithCountriesLoaded = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: countriesReceived,
              lastRefreshed: now
            })
          assert.equal(stateWithCountriesLoaded.getIn(['countriesForLocationSelector', 'items']).size, 2)
          const newState = geography(stateWithCountriesLoaded, {
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1,
            selectedStateId: 1
          })
          assert.deepEqual(stateWithCountriesLoaded, newState)
        })
      })

      describe('when states for the selected country have been loaded', () => {
        it('should show that states for selected country are busy loading', () => {
          const now = new Date(),
            selectedCountryId = 1,
            selectedStateId = 2,
            countriesReceived = [{
              id: 1,
              name: 'South Africa',
              states: [{id: 1, name: 'Eastern Cape'},
                {id: 2, name: 'Gauteng'},
                {id: 3, name: 'Western Cape'}]
            }, {id: 2, name: 'United Sates'}],
            stateWithCountriesAndStatesLoaded = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: countriesReceived,
              lastRefreshed: now
            }), newState = geography(stateWithCountriesAndStatesLoaded, {
              type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
              selectedCountryId: selectedCountryId,
              selectedStateId: selectedStateId
            }), selectedCountry = newState.countriesForLocationSelector.items.find(country => country.id === selectedCountryId),
            selectedState = selectedCountry.children.items.find(state => state.id === selectedStateId)

          assert.isTrue(selectedState.children.loading)
        })
      })
    })

    describe('RECEIVE_LGAS_FOR_LOCATION_SELECTOR', () => {
      describe('when countries haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const initialState = geography(undefined, {}),
            newState = geography(initialState, {
              type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
              states: [{id: 1, name: 'Eastern Cape'},
                {id: 2, name: 'Gauteng'},
                {id: 3, name: 'Western Cape'}],
              selectedCountryId: 1,
              selectedStateId: 2
            })

          assert.deepEqual(initialState, newState)
        })
      })

      describe('when states for the selected country haven\'t been loaded yet', () => {
        it('should not change state', () => {
          const now = new Date(),
            countriesReceived = [{id: 1, name: 'South Africa'}, {id: 2, name: 'United Sates'}],
            stateWithCountriesLoaded = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
              countries: countriesReceived,
              lastRefreshed: now
            }),
            newState = geography(stateWithCountriesLoaded, {
              type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
              states: [{id: 1, name: 'Eastern Cape'},
                {id: 2, name: 'Gauteng'},
                {id: 3, name: 'Western Cape'}],
              selectedCountryId: 1,
              selectedStateId: 2
            })

          assert.deepEqual(stateWithCountriesLoaded, newState)
        })
      })

      describe('when states for the selected country have been loaded', () => {
        let initialState, countries = [{
            id: 1,
            name: 'South Africa',
            states: [{id: 1, name: 'Eastern Cape'},
              {id: 2, name: 'Gauteng'},
              {id: 3, name: 'Western Cape'}]
          }, {id: 2, name: 'United Sates'}],
          now = new Date(),
          selectedCountryId = 1,
          selectedCountry = null,
          indexOfSelectedCountry = -1,
          selectedStateId = 2,
          selectedState = null,
          indexOfSelectedState = -1

        beforeEach(() => {
          initialState = geography(undefined, { type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
            countries: countries,
            lastRefreshed: now
          })
          selectedCountry = initialState.countriesForLocationSelector.items.find(country => country.id === selectedCountryId)
          indexOfSelectedCountry = initialState.countriesForLocationSelector.items.indexOf(selectedCountry)
          selectedState = selectedCountry.children.items.find(state => state.id === selectedStateId)
          indexOfSelectedState = selectedCountry.children.items.indexOf(selectedState)
          initialState = geography(initialState, {
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId: selectedCountryId,
            selectedStateId: selectedStateId
          })
        })

        it('should show that LGAs for the selected state are not loading anymore and update the last refreshed date', () => {
          assert.isTrue(initialState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'items', indexOfSelectedState, 'children',
            'loading']))
          assert.isUndefined(initialState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'items', indexOfSelectedState, 'children',
            'lastRefreshed']))
          const newState = geography(initialState, { type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
            lgas: [],
            selectedCountryId: selectedCountryId,
            selectedStateId: selectedStateId,
            lastRefreshed: now
          })

          assert.isFalse(newState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'items', indexOfSelectedState, 'children',
            'loading']))
          assert.equal(newState.getIn(['countriesForLocationSelector', 'items',
            indexOfSelectedCountry, 'children', 'items', indexOfSelectedState, 'children',
            'lastRefreshed']), now)
        })

        it('should update the items of the selected country to a list of LazyLoadParents', () => {
          const lgasReceived = [{id: 1, name: 'Eastern Cape'},
              {id: 2, name: 'Gauteng'},
              {id: 3, name: 'Western Cape'}],
            lgaIds = _.map(lgasReceived, 'id'),
            lgaNames = _.map(lgasReceived, 'name'),
            newState = geography(initialState, { type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
              lgas: lgasReceived,
              selectedCountryId: selectedCountryId,
              selectedStateId: selectedStateId,
              lastRefreshed: now
            }), selectedStateLgas = newState.getIn(['countriesForLocationSelector', 'items', indexOfSelectedCountry,
              'children', 'items', indexOfSelectedState, 'children', 'items'])

          assert.instanceOf(selectedStateLgas, Immutable.List)
          assert.equal(selectedStateLgas.size, lgasReceived.length)
          selectedStateLgas.forEach(lgaRecord => {
            assert.include(lgaIds, lgaRecord.id)
            assert.include(lgaNames, lgaRecord.name)
          })
        })
      })
    })
  })
})

describe('geography action creators', () => {
  const fiveMinutes = 300000, //five minutes
    LazyLoadItems = Immutable.Record({
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

  let clock, now, geographyRedux, dispatch, freshCacheTime, expiredCacheTime,
    countriesState = new LazyLoadItems({
      loading: false,
      items: Immutable.List(),
      lastRefreshed: undefined
    })

  function createGeographyReduxWithStubs(fetchStub, errorCreatorsStub) {
    const proxyDependencies = {
      '../shared/utils/fetch': fetchStub
    }
    if(errorCreatorsStub) {
      proxyDependencies['../error/ErrorRedux'] = errorCreatorsStub
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
          const dispatchFunction = geographyRedux.fetchCountriesForLocationSelector(false, countriesState)
          dispatchFunction(dispatch)
          assert.isTrue(dispatch.notCalled)
        })
      })

      describe('and the countries cache has expired', () => {
        const expectedCountriesToDispatch = ['List of countries'],
          expectedResponseFromServer = Promise.resolve({ok: true, data: expectedCountriesToDispatch})
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
          const dispatchFunction = geographyRedux.fetchCountriesForLocationSelector(false, countriesState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{
            type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR
          }], 'REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of countries from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/country-select-list'), 'A request to /geography/country-select-list was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR action with the countries received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedCountriesToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
                countries: expectedCountriesToDispatch,
                lastRefreshed: now}])
            })
          })
        })
      })

      describe('and the countries cache has not been loaded yet', () => {
        const expectedCountriesToDispatch = ['List of countries'],
          expectedResponseFromServer = Promise.resolve({ok: true, data: expectedCountriesToDispatch})
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
          const dispatchFunction = geographyRedux.fetchCountriesForLocationSelector(false, countriesState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{ type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR }], 'REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of countries from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/country-select-list'), 'A request to /geography/country-select-list was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR action with the countries received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedCountriesToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
                countries: expectedCountriesToDispatch,
                lastRefreshed: now}])
            })
          })
        })
      })
    })

    describe('when force refresh is true', () => {
      describe('and the countries cache is still fresh', () => {
        const expectedCountriesToDispatch = ['List of countries'],
          expectedResponseFromServer = Promise.resolve({ok: true, data: expectedCountriesToDispatch})
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
          const dispatchFunction = geographyRedux.fetchCountriesForLocationSelector(true, countriesState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{ type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR }], 'REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of countries from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/country-select-list'), 'A request to /geography/country-select-list was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR action with the countries received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedCountriesToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
                countries: expectedCountriesToDispatch,
                lastRefreshed: now}])
            })
          })
        })
      })

      describe('and the countries cache has expired', () => {
        const expectedCountriesToDispatch = ['List of countries'],
          expectedResponseFromServer = Promise.resolve({ok: true, data: expectedCountriesToDispatch})
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
          const dispatchFunction = geographyRedux.fetchCountriesForLocationSelector(true, countriesState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{ type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR }], 'REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of countries from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/country-select-list'), 'A request to /geography/country-select-list was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR action with the countries received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedCountriesToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
                countries: expectedCountriesToDispatch,
                lastRefreshed: now}])
            })
          })
        })
      })

      describe('and the countries cache has not been loaded yet', () => {
        const expectedCountriesToDispatch = ['List of countries'],
          expectedResponseFromServer = Promise.resolve({ok: true, data: expectedCountriesToDispatch})
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
          const dispatchFunction = geographyRedux.fetchCountriesForLocationSelector(true, countriesState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{ type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR }], 'REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of countries from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/country-select-list'), 'A request to /geography/country-select-list was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR action with the countries received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedCountriesToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
                countries: expectedCountriesToDispatch,
                lastRefreshed: now}])
            })
          })
        })
      })
    })

    describe('when selected country is specified', () => {
      describe('and the countries cache has not been loaded yet', () => {
        const expectedCountriesToDispatch = ['List of countries'],
          expectedResponseFromServer = Promise.resolve({ok: true, data: expectedCountriesToDispatch}),
          selectedCountryId = 2
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/geography/country-select-list/' + selectedCountryId)
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          const dispatchFunction = geographyRedux.fetchCountriesForLocationSelector(false, countriesState, selectedCountryId)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{ type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR }], 'REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of countries from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/country-select-list/' + selectedCountryId), 'A request to /geography/country-select-list/{countryId} was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR action with the countries received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedCountriesToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
                countries: expectedCountriesToDispatch,
                lastRefreshed: now}])
            })
          })
        })
      })
    })

    describe('when selected country and state are specified', () => {
      describe('and the countries cache has not been loaded yet', () => {
        const expectedCountriesToDispatch = ['List of countries'],
          expectedResponseFromServer = Promise.resolve({ok: true, data: expectedCountriesToDispatch}),
          selectedCountryId = 1,
          selectedStateId = 2
        let fetchStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/geography/country-select-list/' + selectedCountryId + '/' + selectedStateId)
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          createGeographyReduxWithStubs(fetchStub)
          const dispatchFunction = geographyRedux.fetchCountriesForLocationSelector(false, countriesState, selectedCountryId, selectedStateId)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{ type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR }], 'REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of countries from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/country-select-list/' + selectedCountryId + '/' + selectedStateId), 'A request to /geography/country-select-list/{countryId} was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR action with the countries received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedCountriesToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_COUNTRIES_FOR_LOCATION_SELECTOR,
                countries: expectedCountriesToDispatch,
                lastRefreshed: now}])
            })
          })
        })
      })
    })

    describe('When the server encounters a problem', () => {
      const expectedError = {message: 'An unexpected error happened'},
        expectedResponseFromServer = Promise.reject(expectedError),
        expectedErrorAction = { type: 'ERROR' }
      let fetchStub, errorCreatorsStub

      beforeEach(() => {
        fetchStub = {
          aspectFetch: sinon.stub()
        }
        fetchStub.aspectFetch.withArgs('/geography/country-select-list')
          .returns(expectedResponseFromServer)
        errorCreatorsStub = {
          addError: sinon.stub()
        }
        errorCreatorsStub.addError.withArgs('Loading countries failed', expectedError.message, expectedError)
          .returns(expectedErrorAction)
        dispatch = sinon.spy()
        createGeographyReduxWithStubs(fetchStub, errorCreatorsStub)
        const dispatchFunction = geographyRedux.fetchCountriesForLocationSelector(true, countriesState)
        dispatchFunction(dispatch)
      })

      it('Should dispatch a REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR action', () => {
        assert.deepEqual(dispatch.firstCall.args, [{ type: types.REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR }], 'REQUEST_COUNTRIES_FOR_LOCATION_SELECTOR Was Not Dispatched')
      })

      it('Should request a new list of countries from the server', () => {
        assert(fetchStub.aspectFetch.calledWith('/geography/country-select-list'), 'A request to /geography/country-select-list was not detected')
      })

      describe('and a response is received from the server', () => {
        it('Should dispatch an error action', () => {
          return expectedResponseFromServer.then().catch(err => {
            assert.deepEqual(err, expectedError)
            assert.deepEqual(dispatch.secondCall.args, [expectedErrorAction])
          })
        })
      })
    })
  })

  describe('fetchStatesForLocationSelector', () => {
    before(() => {
      countriesState = createCountriesStateWith([{id: 1, name: 'South Africa'},
        {id: 2, name: 'United Sates'}], now)
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
          assert.isTrue(dispatch.notCalled)
        })
      })

      describe('and the states cache for the selected country has expired', () => {
        const expectedStatesToDispatch = ['List of states'],
          expectedResponseFromServer = Promise.resolve({ok: true, data: expectedStatesToDispatch})
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
          const selectedCountry = getCountryAt(0),
            dispatchFunction = geographyRedux.fetchStatesForLocationSelector(false, selectedCountry)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_STATES_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{
            type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1
          }], 'REQUEST_STATES_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of states from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/state-select-list/1'), 'A request to /geography/state-select-list/{countryId} was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_STATES_FOR_LOCATION_SELECTOR action with the states received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedStatesToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
                states: expectedStatesToDispatch,
                selectedCountryId: 1,
                lastRefreshed: now}])
            })
          })
        })
      })

      describe('and the states cache for the selected country cache has not been loaded yet', () => {
        const expectedStatesToDispatch = ['List of states'],
          expectedResponseFromServer = Promise.resolve({ok: true, data: expectedStatesToDispatch})
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
          const selectedCountry = getCountryAt(0),
            dispatchFunction = geographyRedux.fetchStatesForLocationSelector(false, selectedCountry)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_STATES_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{
            type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1
          }], 'REQUEST_STATES_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of states from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/state-select-list/1'), 'A request to /geography/state-select-list/{countryId} was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_STATES_FOR_LOCATION_SELECTOR action with the states received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedStatesToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
                states: expectedStatesToDispatch,
                selectedCountryId: 1,
                lastRefreshed: now}])
            })
          })
        })
      })
    })

    describe('when force refresh is true', () => {
      describe('and the states cache for the selected country is still fresh', () => {
        const expectedStatesToDispatch = ['List of states'],
          expectedResponseFromServer = Promise.resolve({ok: true, data: expectedStatesToDispatch})
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
          const selectedCountry = getCountryAt(0),
            dispatchFunction = geographyRedux.fetchStatesForLocationSelector(true, selectedCountry)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_STATES_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{
            type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1
          }], 'REQUEST_STATES_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of states from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/state-select-list/1'), 'A request to /geography/state-select-list/{countryId} was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_STATES_FOR_LOCATION_SELECTOR action with the states received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedStatesToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
                states: expectedStatesToDispatch,
                selectedCountryId: 1,
                lastRefreshed: now}])
            })
          })
        })
      })

      describe('and the states cache for the selected country has expired', () => {
        const expectedStatesToDispatch = ['List of states'],
          expectedResponseFromServer = Promise.resolve({ok: true, data: expectedStatesToDispatch})
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
          const selectedCountry = getCountryAt(0),
            dispatchFunction = geographyRedux.fetchStatesForLocationSelector(true, selectedCountry)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_STATES_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{
            type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1
          }], 'REQUEST_STATES_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of states from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/state-select-list/1'), 'A request to /geography/state-select-list/{countryId} was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_STATES_FOR_LOCATION_SELECTOR action with the states received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedStatesToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
                states: expectedStatesToDispatch,
                selectedCountryId: 1,
                lastRefreshed: now}])
            })
          })
        })
      })

      describe('and the states cache for the selected country cache has not been loaded yet', () => {
        const expectedStatesToDispatch = ['List of states'],
          expectedResponseFromServer = Promise.resolve({ok: true, data: expectedStatesToDispatch})
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
          const selectedCountry = getCountryAt(0),
            dispatchFunction = geographyRedux.fetchStatesForLocationSelector(true, selectedCountry)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_STATES_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{
            type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1
          }], 'REQUEST_STATES_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of states from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/state-select-list/1'), 'A request to /geography/state-select-list/{countryId} was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_STATES_FOR_LOCATION_SELECTOR action with the states received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedStatesToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_STATES_FOR_LOCATION_SELECTOR,
                states: expectedStatesToDispatch,
                selectedCountryId: 1,
                lastRefreshed: now}])
            })
          })
        })
      })
    })

    describe('When the server encounters a problem', () => {
      const expectedError = {message: 'An unexpected error happened'},
        expectedResponseFromServer = Promise.reject(expectedError),
        expectedErrorAction = { type: 'ERROR' }
      let fetchStub, errorCreatorsStub

      beforeEach(() => {
        fetchStub = {
          aspectFetch: sinon.stub()
        }
        fetchStub.aspectFetch.withArgs('/geography/state-select-list/1')
          .returns(expectedResponseFromServer)
        errorCreatorsStub = {
          addError: sinon.stub()
        }
        errorCreatorsStub.addError.withArgs('Loading states failed', expectedError.message, expectedError)
          .returns(expectedErrorAction)
        dispatch = sinon.spy()
        createGeographyReduxWithStubs(fetchStub, errorCreatorsStub)
        countriesState = setLastRefreshedTimeOnCountryStates(0, undefined)
        const selectedCountry = getCountryAt(0),
          dispatchFunction = geographyRedux.fetchStatesForLocationSelector(true, selectedCountry)
        dispatchFunction(dispatch)
      })

      it('Should dispatch a REQUEST_STATES_FOR_LOCATION_SELECTOR action', () => {
        assert.deepEqual(dispatch.firstCall.args, [{
          type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
          selectedCountryId: 1
        }], 'REQUEST_STATES_FOR_LOCATION_SELECTOR Was Not Dispatched')
      })

      it('Should request a new list of states from the server', () => {
        assert(fetchStub.aspectFetch.calledWith('/geography/state-select-list/1'), 'A request to /geography/state-select-list/{countryId} was not detected')
      })

      describe('and a response is received from the server', () => {
        it('Should dispatch an error action', () => {
          return expectedResponseFromServer.then().catch(err => {
            assert.deepEqual(err, expectedError)
            assert.deepEqual(dispatch.secondCall.args, [expectedErrorAction])
          })
        })
      })
    })
  })

  describe('fetchLgasForLocationSelector', () => {
    before(() => {
      countriesState = createCountriesStateWith([{
        id: 1,
        name: 'South Africa',
        states: [{id: 1, name: 'Eastern Cape'},
          {id: 2, name: 'Gauteng'}]
      }, {id: 2, name: 'United Sates'}], now)
    })

    describe('when force refresh is false', () => {
      describe('and the LGAs cache for the selected state is still fresh', () => {
        beforeEach(() => {
          dispatch = sinon.spy()
          geographyRedux = require('./GeographyRedux')
          countriesState = setLastRefreshedTimeOnStateLGAs(0, 0, freshCacheTime)
        })

        it('Should return a dispatch function that dispatches nothing', () => {
          const selectedCountry = getCountryAt(0),
            selectedState = getStateAt(0, 0),
            dispatchFunction = geographyRedux.fetchLgasForLocationSelector(false,
              selectedCountry, selectedState)
          dispatchFunction(dispatch)
          assert.isTrue(dispatch.notCalled)
        })
      })

      describe('and the LGAs cache for the selected state has expired', () => {
        const expectedLgasToDispatch = ['List of LGAs'],
          expectedResponseFromServer = Promise.resolve({ok: true, data: expectedLgasToDispatch})
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
          const selectedCountry = getCountryAt(0),
            selectedState = getStateAt(0, 0),
            dispatchFunction = geographyRedux.fetchLgasForLocationSelector(false, selectedCountry, selectedState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_LGAS_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1,
            selectedStateId: 1
          }], 'REQUEST_LGAS_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of LGAs from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/lga-select-list/1'), 'A request to /geography/lga-select-list/{stateId} was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_LGAS_FOR_LOCATION_SELECTOR action with the lgas received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedLgasToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
                lgas: expectedLgasToDispatch,
                selectedCountryId: 1,
                selectedStateId: 1,
                lastRefreshed: now}])
            })
          })
        })
      })

      describe('and the LGAs cache for the selected state cache has not been loaded yet', () => {
        const expectedLGAsToDispatch = ['List of LGAs'],
          expectedResponseFromServer = Promise.resolve({ok: true, data: expectedLGAsToDispatch})
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
          const selectedCountry = getCountryAt(0),
            selectedState = getStateAt(0, 0),
            dispatchFunction = geographyRedux.fetchLgasForLocationSelector(false, selectedCountry, selectedState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_LGAS_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1,
            selectedStateId: 1
          }], 'REQUEST_LGAS_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of LGAs from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/lga-select-list/1'), 'A request to /geography/lga-select-list/{stateId} was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_LGAS_FOR_LOCATION_SELECTOR action with the LGAs received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedLGAsToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
                lgas: expectedLGAsToDispatch,
                selectedCountryId: 1,
                selectedStateId: 1,
                lastRefreshed: now}])
            })
          })
        })
      })
    })

    describe('when force refresh is true', () => {
      describe('and the LGAs cache for the selected state is still fresh', () => {
        const expectedLgasToDispatch = ['List of LGAs'],
          expectedResponseFromServer = Promise.resolve({ok: true, data: expectedLgasToDispatch})
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
          const selectedCountry = getCountryAt(0),
            selectedState = getStateAt(0, 0),
            dispatchFunction = geographyRedux.fetchLgasForLocationSelector(true, selectedCountry, selectedState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_LGAS_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1,
            selectedStateId: 1
          }], 'REQUEST_LGAS_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of LGAs from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/lga-select-list/1'), 'A request to /geography/lga-select-list/{stateId} was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_LGAS_FOR_LOCATION_SELECTOR action with the LGAs received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedLgasToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
                lgas: expectedLgasToDispatch,
                selectedCountryId: 1,
                selectedStateId: 1,
                lastRefreshed: now}])
            })
          })
        })
      })

      describe('and the LGAs cache for the selected state has expired', () => {
        const expectedLgasToDispatch = ['List of LGAs'],
          expectedResponseFromServer = Promise.resolve({ok: true, data: expectedLgasToDispatch})
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
          const selectedCountry = getCountryAt(0),
            selectedState = getStateAt(0, 0),
            dispatchFunction = geographyRedux.fetchLgasForLocationSelector(true, selectedCountry, selectedState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_LGAS_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1,
            selectedStateId: 1
          }], 'REQUEST_LGAS_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of LGAs from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/lga-select-list/1'), 'A request to /geography/lga-select-list/{stateId} was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_LGAS_FOR_LOCATION_SELECTOR action with the LGAs received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedLgasToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
                lgas: expectedLgasToDispatch,
                selectedCountryId: 1,
                selectedStateId: 1,
                lastRefreshed: now}])
            })
          })
        })
      })

      describe('and the LGAs cache for the selected state cache has not been loaded yet', () => {
        const expectedLgasToDispatch = ['List of LGAs'],
          expectedResponseFromServer = Promise.resolve({ok: true, data: expectedLgasToDispatch})
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
          const selectedCountry = getCountryAt(0),
            selectedState = getStateAt(0, 0),
            dispatchFunction = geographyRedux.fetchLgasForLocationSelector(true, selectedCountry, selectedState)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_LGAS_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{
            type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1,
            selectedStateId: 1
          }], 'REQUEST_LGAS_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of LGAs from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/lga-select-list/1'), 'A request to /geography/lga-select-list/{stateId} was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_LGAS_FOR_LOCATION_SELECTOR action with the LGAs received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedLgasToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_LGAS_FOR_LOCATION_SELECTOR,
                lgas: expectedLgasToDispatch,
                selectedCountryId: 1,
                selectedStateId: 1,
                lastRefreshed: now}])
            })
          })
        })
      })
    })

    describe('When the server encounters a problem', () => {
      const expectedError = {message: 'An unexpected error happened'},
        expectedResponseFromServer = Promise.reject(expectedError),
        expectedErrorAction = { type: 'ERROR' }
      let fetchStub, errorCreatorsStub

      beforeEach(() => {
        fetchStub = {
          aspectFetch: sinon.stub()
        }
        fetchStub.aspectFetch.withArgs('/geography/lga-select-list/1')
          .returns(expectedResponseFromServer)
        errorCreatorsStub = {
          addError: sinon.stub()
        }
        errorCreatorsStub.addError.withArgs('Loading LGAs failed', expectedError.message, expectedError)
          .returns(expectedErrorAction)
        dispatch = sinon.spy()
        createGeographyReduxWithStubs(fetchStub, errorCreatorsStub)
        countriesState = setLastRefreshedTimeOnStateLGAs(0, 0, undefined)
        const selectedCountry = getCountryAt(0),
          selectedState = getStateAt(0, 0),
          dispatchFunction = geographyRedux.fetchLgasForLocationSelector(true, selectedCountry, selectedState)
        dispatchFunction(dispatch)
      })

      it('Should dispatch a REQUEST_LGAS_FOR_LOCATION_SELECTOR action', () => {
        assert.deepEqual(dispatch.firstCall.args, [{
          type: types.REQUEST_LGAS_FOR_LOCATION_SELECTOR,
          selectedCountryId: 1,
          selectedStateId: 1
        }], 'REQUEST_LGAS_FOR_LOCATION_SELECTOR Was Not Dispatched')
      })

      it('Should request a new list of LGAs from the server', () => {
        assert(fetchStub.aspectFetch.calledWith('/geography/lga-select-list/1'), 'A request to /geography/lga-select-list/{stateId} was not detected')
      })

      describe('and a response is received from the server', () => {
        it('Should dispatch an error action', () => {
          return expectedResponseFromServer.then().catch(err => {
            assert.deepEqual(err, expectedError)
            assert.deepEqual(dispatch.secondCall.args, [expectedErrorAction])
          })
        })
      })
    })
  })
})
