import { assert } from 'chai'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import Immutable from 'immutable'
import _ from 'lodash'
import types from './../constants/action_types'

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

  let clock, now, geographyCreators, dispatch, freshCacheTime, expiredCacheTime,
    countriesState = new LazyLoadItems({
      loading: false,
      items: Immutable.List(),
      lastRefreshed: undefined
    })

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
          geographyCreators = require('./geography_creators')
          countriesState = setLastRefreshedTimeOnCountries(freshCacheTime)
        })

        it('Should return a dispatch function that dispatches nothing', () => {
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(false, countriesState)
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
          geographyCreators = proxyquire('./geography_creators', {
            '../utils/fetch': fetchStub
          })
          countriesState = setLastRefreshedTimeOnCountries(expiredCacheTime)
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(false, countriesState)
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
          geographyCreators = proxyquire('./geography_creators', {
            '../utils/fetch': fetchStub
          })
          countriesState = setLastRefreshedTimeOnCountries(undefined)
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(false, countriesState)
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
          geographyCreators = proxyquire('./geography_creators', {
            '../utils/fetch': fetchStub
          })
          countriesState = setLastRefreshedTimeOnCountries(freshCacheTime)
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(true, countriesState)
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
          geographyCreators = proxyquire('./geography_creators', {
            '../utils/fetch': fetchStub
          })
          countriesState = setLastRefreshedTimeOnCountries(expiredCacheTime)
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(true, countriesState)
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
          geographyCreators = proxyquire('./geography_creators', {
            '../utils/fetch': fetchStub
          })
          countriesState = setLastRefreshedTimeOnCountries(undefined)
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(true, countriesState)
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
          geographyCreators = proxyquire('./geography_creators', {
            '../utils/fetch': fetchStub
          })
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(false, countriesState, selectedCountryId)
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
          geographyCreators = proxyquire('./geography_creators', {
            '../utils/fetch': fetchStub
          })
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(false, countriesState, selectedCountryId, selectedStateId)
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
        geographyCreators = proxyquire('./geography_creators', {
          '../utils/fetch': fetchStub,
          './error_creators': errorCreatorsStub
        })
        const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(true, countriesState)
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
          geographyCreators = require('./geography_creators')
          countriesState = setLastRefreshedTimeOnCountryStates(0, freshCacheTime)
        })

        it('Should return a dispatch function that dispatches nothing', () => {
          const selectedCountry = getCountryAt(0)
          const dispatchFunction = geographyCreators.fetchStatesForLocationSelector(false,
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
          geographyCreators = proxyquire('./geography_creators', {
            '../utils/fetch': fetchStub
          })
          countriesState = setLastRefreshedTimeOnCountryStates(0, expiredCacheTime)
          const selectedCountry = getCountryAt(0),
            dispatchFunction = geographyCreators.fetchStatesForLocationSelector(false, selectedCountry)
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
          geographyCreators = proxyquire('./geography_creators', {
            '../utils/fetch': fetchStub
          })
          countriesState = setLastRefreshedTimeOnCountryStates(0, undefined)
          const selectedCountry = getCountryAt(0),
            dispatchFunction = geographyCreators.fetchStatesForLocationSelector(false, selectedCountry)
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
          geographyCreators = proxyquire('./geography_creators', {
            '../utils/fetch': fetchStub
          })
          countriesState = setLastRefreshedTimeOnCountryStates(0, freshCacheTime)
          const selectedCountry = getCountryAt(0),
            dispatchFunction = geographyCreators.fetchStatesForLocationSelector(true, selectedCountry)
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
          geographyCreators = proxyquire('./geography_creators', {
            '../utils/fetch': fetchStub
          })
          countriesState = setLastRefreshedTimeOnCountryStates(0, expiredCacheTime)
          const selectedCountry = getCountryAt(0),
            dispatchFunction = geographyCreators.fetchStatesForLocationSelector(true, selectedCountry)
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
          geographyCreators = proxyquire('./geography_creators', {
            '../utils/fetch': fetchStub
          })
          countriesState = setLastRefreshedTimeOnCountryStates(0, undefined)
          const selectedCountry = getCountryAt(0),
            dispatchFunction = geographyCreators.fetchStatesForLocationSelector(true, selectedCountry)
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
        geographyCreators = proxyquire('./geography_creators', {
          '../utils/fetch': fetchStub,
          './error_creators': errorCreatorsStub
        })
        countriesState = setLastRefreshedTimeOnCountryStates(0, undefined)
        const selectedCountry = getCountryAt(0),
          dispatchFunction = geographyCreators.fetchStatesForLocationSelector(true, selectedCountry)
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
          geographyCreators = require('./geography_creators')
          countriesState = setLastRefreshedTimeOnStateLGAs(0, 0, freshCacheTime)
        })

        it('Should return a dispatch function that dispatches nothing', () => {
          const selectedCountry = getCountryAt(0),
            selectedState = getStateAt(0, 0),
            dispatchFunction = geographyCreators.fetchLgasForLocationSelector(false,
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
          fetchStub.aspectFetch.withArgs('/geography/lga-select-list/1/1')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          geographyCreators = proxyquire('./geography_creators', {
            '../utils/fetch': fetchStub
          })
          countriesState = setLastRefreshedTimeOnStateLGAs(0, 0, expiredCacheTime)
          const selectedCountry = getCountryAt(0),
            selectedState = getStateAt(0, 0),
            dispatchFunction = geographyCreators.fetchLgasForLocationSelector(false, selectedCountry, selectedState)
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
          assert(fetchStub.aspectFetch.calledWith('/geography/lga-select-list/1/1'), 'A request to /geography/lga-select-list/{countryId}/{stateId} was not detected')
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
          fetchStub.aspectFetch.withArgs('/geography/lga-select-list/1/1')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          geographyCreators = proxyquire('./geography_creators', {
            '../utils/fetch': fetchStub
          })
          countriesState = setLastRefreshedTimeOnStateLGAs(0, 0, undefined)
          const selectedCountry = getCountryAt(0),
            selectedState = getStateAt(0, 0),
            dispatchFunction = geographyCreators.fetchLgasForLocationSelector(false, selectedCountry, selectedState)
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
          assert(fetchStub.aspectFetch.calledWith('/geography/lga-select-list/1/1'), 'A request to /geography/lga-select-list/{countryId}/{stateId} was not detected')
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
          fetchStub.aspectFetch.withArgs('/geography/lga-select-list/1/1')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          geographyCreators = proxyquire('./geography_creators', {
            '../utils/fetch': fetchStub
          })
          countriesState = setLastRefreshedTimeOnStateLGAs(0, 0, freshCacheTime)
          const selectedCountry = getCountryAt(0),
            selectedState = getStateAt(0, 0),
            dispatchFunction = geographyCreators.fetchLgasForLocationSelector(true, selectedCountry, selectedState)
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
          assert(fetchStub.aspectFetch.calledWith('/geography/lga-select-list/1/1'), 'A request to /geography/lga-select-list/{countryId}/{stateId} was not detected')
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
          fetchStub.aspectFetch.withArgs('/geography/lga-select-list/1/1')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          geographyCreators = proxyquire('./geography_creators', {
            '../utils/fetch': fetchStub
          })
          countriesState = setLastRefreshedTimeOnStateLGAs(0, 0, expiredCacheTime)
          const selectedCountry = getCountryAt(0),
            selectedState = getStateAt(0, 0),
            dispatchFunction = geographyCreators.fetchLgasForLocationSelector(true, selectedCountry, selectedState)
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
          assert(fetchStub.aspectFetch.calledWith('/geography/lga-select-list/1/1'), 'A request to /geography/lga-select-list/{countryId}/{stateId} was not detected')
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
          fetchStub.aspectFetch.withArgs('/geography/lga-select-list/1/1')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          geographyCreators = proxyquire('./geography_creators', {
            '../utils/fetch': fetchStub
          })
          countriesState = setLastRefreshedTimeOnStateLGAs(0, 0, undefined)
          const selectedCountry = getCountryAt(0),
            selectedState = getStateAt(0, 0),
            dispatchFunction = geographyCreators.fetchLgasForLocationSelector(true, selectedCountry, selectedState)
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
          assert(fetchStub.aspectFetch.calledWith('/geography/lga-select-list/1/1'), 'A request to /geography/lga-select-list/{countryId}/{stateId} was not detected')
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
        fetchStub.aspectFetch.withArgs('/geography/lga-select-list/1/1')
          .returns(expectedResponseFromServer)
        errorCreatorsStub = {
          addError: sinon.stub()
        }
        errorCreatorsStub.addError.withArgs('Loading LGAs failed', expectedError.message, expectedError)
          .returns(expectedErrorAction)
        dispatch = sinon.spy()
        geographyCreators = proxyquire('./geography_creators', {
          '../utils/fetch': fetchStub,
          './error_creators': errorCreatorsStub
        })
        countriesState = setLastRefreshedTimeOnStateLGAs(0, 0, undefined)
        const selectedCountry = getCountryAt(0),
          selectedState = getStateAt(0, 0),
          dispatchFunction = geographyCreators.fetchLgasForLocationSelector(true, selectedCountry, selectedState)
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
        assert(fetchStub.aspectFetch.calledWith('/geography/lga-select-list/1/1'), 'A request to /geography/lga-select-list/{countryId}/{stateId} was not detected')
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
