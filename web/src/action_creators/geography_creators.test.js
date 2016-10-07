import { assert } from 'chai'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import Immutable from 'immutable'
import types from './../constants/action_types'

describe('geography action creators', () => {
  let clock, now, geographyCreators, dispatch

  before(() => {
    now = new Date()
    clock = sinon.useFakeTimers(now.getTime())
  })

  after(() => {
    clock.restore()
  })

  describe('fetchCountriesForLocationSelector', () => {
    const LazyLoadItems = Immutable.Record({
      loading: false,
      items: Immutable.List(),
      lastRefreshed: undefined
    })
    let countriesState = new LazyLoadItems({
      loading: false,
      items: Immutable.List(),
      lastRefreshed: undefined
    })

    describe('when force refresh is false', () => {
      describe('and the last time the countries were fetched was less than 5 minutes ago', () => {
        beforeEach(() => {
          dispatch = sinon.spy()
          geographyCreators = require('./geography_creators')
        })

        it('Should return a dispatch function that dispatches nothing', () => {
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(false,
            countriesState.setIn(['lastRefreshed'], new Date(now - 299999)))
          dispatchFunction(dispatch)
          assert.isTrue(dispatch.notCalled)
        })
      })

      describe('and the last time the countries were fetched was more than 5 minutes ago', () => {
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
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(false, countriesState.setIn(['lastRefreshed'], new Date(now - 300001)))
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

      describe('and the last time the countries were fetched is unknown', () => {
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
      describe('and the last time the countries were fetched was less than 5 minutes ago', () => {
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
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(true, countriesState.setIn(['lastRefreshed'], new Date(now - 299999)))
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

      describe('and the last time the countries were fetched was more than 5 minutes ago', () => {
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
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(true, countriesState.setIn(['lastRefreshed'], new Date(now - 300001)))
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

      describe('and the last time the countries were fetched is unknown', () => {
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
      describe('and the last time the countries were fetched is unknown', () => {
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
      describe('and the last time the countries were fetched is unknown', () => {
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
    const now = new Date(),
      LazyLoadItems = Immutable.Record({
        loading: false,
        items: Immutable.List(),
        lastRefreshed: undefined
      }), LazyLoadParent = Immutable.Record({
        id: undefined,
        name: undefined,
        children: new LazyLoadItems()
      })
    let countriesState = new LazyLoadItems({
        loading: false,
        items: Immutable.List([new LazyLoadParent({id: 1, name: 'South Africa'}),
          new LazyLoadParent({id: 2, name: 'United Sates'})]),
        lastRefreshed: now
      }), clock

    beforeEach(() => {
      clock = sinon.useFakeTimers(now.getTime())
    })

    afterEach(() => {
      clock.restore()
    })

    describe('when force refresh is false', () => {
      describe('and the last time the states were fetched was less than 5 minutes ago', () => {
        beforeEach(() => {
          dispatch = sinon.spy()
          geographyCreators = require('./geography_creators')
          countriesState = countriesState.setIn(['items', 0, 'children', 'lastRefreshed'], new Date(now - 299999))
        })

        it('Should return a dispatch function that dispatches nothing', () => {
          const selectedCountry = countriesState.getIn(['items', 0])
          const dispatchFunction = geographyCreators.fetchStatesForLocationSelector(false,
            selectedCountry)
          dispatchFunction(dispatch)
          assert.isTrue(dispatch.notCalled)
        })
      })

      describe('and the last time the states were fetched was more than 5 minutes ago', () => {
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
          const selectedCountry = countriesState.setIn(['items', 0, 'children', 'lastRefreshed'],
            new Date(now - 300001)).getIn(['items', 0]),
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

      describe('and the last time the states were fetched is unknown', () => {
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
          const selectedCountry = countriesState.setIn(['items', 0, 'children', 'lastRefreshed'],
            undefined).getIn(['items', 0]),
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
      describe('and the last time the states for the country were fetched was less than 5 minutes ago', () => {
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
          const selectedCountry = countriesState.setIn(['items', 0, 'children', 'lastRefreshed'],
            new Date(now - 299999)).getIn(['items', 0]),
            dispatchFunction = geographyCreators.fetchStatesForLocationSelector(true, selectedCountry)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_STATES_FOR_LOCATION_SELECTOR action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{
            type: types.REQUEST_STATES_FOR_LOCATION_SELECTOR,
            selectedCountryId: 1
          }], 'REQUEST_STATES_FOR_LOCATION_SELECTOR Was Not Dispatched')
        })

        it('Should request a new list of countries from the server', () => {
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

      describe('and the last time the states were fetched was more than 5 minutes ago', () => {
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
          const selectedCountry = countriesState.setIn(['items', 0, 'children', 'lastRefreshed'],
            new Date(now - 300001)).getIn(['items', 0]),
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

      describe('and the last time the states were fetched is unknown', () => {
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
          const selectedCountry = countriesState.setIn(['items', 0, 'children', 'lastRefreshed'],
            undefined).getIn(['items', 0]),
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
        const selectedCountry = countriesState.setIn(['items', 0, 'children', 'lastRefreshed'],
          undefined).getIn(['items', 0]),
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
})
