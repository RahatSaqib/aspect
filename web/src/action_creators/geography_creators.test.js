import { assert } from 'chai'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
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
    describe('when force refresh is false', () => {
      describe('and the last time the countries were fetched was less than 5 minutes ago', () => {
        beforeEach(() => {
          dispatch = sinon.spy()
          geographyCreators = require('./geography_creators')
        })

        it('Should return a dispatch function that dispatches nothing', () => {
          const lessThanFiveMinutesAgo = new Date(now - 299999)
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(false, lessThanFiveMinutesAgo)
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
          const moreThanFiveMinutesAgo = new Date(now - 300001)
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(false, moreThanFiveMinutesAgo)
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
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(false)
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
          const lessThanFiveMinutesAgo = new Date(now - 299999)
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(true, lessThanFiveMinutesAgo)
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
          const moreThanFiveMinutesAgo = new Date(now - 300001)
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(true, moreThanFiveMinutesAgo)
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
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(true)
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
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(false, undefined, selectedCountryId)
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
          const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(false, undefined, selectedCountryId, selectedStateId)
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
        const dispatchFunction = geographyCreators.fetchCountriesForLocationSelector(true, now)
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
})
