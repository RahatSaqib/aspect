import { assert } from 'chai'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import types from './../constants/action_types'

describe('country action creators', () => {
  let clock, now, countryCreators, dispatch

  before(() => {
    now = new Date()
    clock = sinon.useFakeTimers(now.getTime())
  })

  after(() => {
    clock.restore()
  })

  describe('fetchCountriesForSelectLists', () => {
    describe('when force refresh is false', () => {
      describe('and the last time the countries were fetched was less than 5 minutes ago', () => {
        beforeEach(() => {
          dispatch = sinon.spy()
          countryCreators = require('./country_creators')
        })

        it('Should return a dispatch function that dispatches nothing', () => {
          const lessThanFiveMinutesAgo = new Date(now - 299999)
          const dispatchFunction = countryCreators.fetchCountriesForSelectLists(false, lessThanFiveMinutesAgo)
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
          fetchStub.aspectFetch.withArgs('/geography/select-list')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          countryCreators = proxyquire('./country_creators', {
            '../utils/fetch': fetchStub
          })
          const moreThanFiveMinutesAgo = new Date(now - 300001)
          const dispatchFunction = countryCreators.fetchCountriesForSelectLists(false, moreThanFiveMinutesAgo)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_SELECT_LISTS action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{ type: types.REQUEST_COUNTRIES_FOR_SELECT_LISTS }], 'REQUEST_COUNTRIES_FOR_SELECT_LISTS Was Not Dispatched')
        })

        it('Should request a new list of countries from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/select-list'), 'A request to /geography/select-list was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_SELECT_LISTS action with the countries received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedCountriesToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_COUNTRIES_FOR_SELECT_LISTS,
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
          fetchStub.aspectFetch.withArgs('/geography/select-list')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          countryCreators = proxyquire('./country_creators', {
            '../utils/fetch': fetchStub
          })
          const dispatchFunction = countryCreators.fetchCountriesForSelectLists(false)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_SELECT_LISTS action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{ type: types.REQUEST_COUNTRIES_FOR_SELECT_LISTS }], 'REQUEST_COUNTRIES_FOR_SELECT_LISTS Was Not Dispatched')
        })

        it('Should request a new list of countries from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/select-list'), 'A request to /geography/select-list was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_SELECT_LISTS action with the countries received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedCountriesToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_COUNTRIES_FOR_SELECT_LISTS,
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
          fetchStub.aspectFetch.withArgs('/geography/select-list')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          countryCreators = proxyquire('./country_creators', {
            '../utils/fetch': fetchStub
          })
          const lessThanFiveMinutesAgo = new Date(now - 299999)
          const dispatchFunction = countryCreators.fetchCountriesForSelectLists(true, lessThanFiveMinutesAgo)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_SELECT_LISTS action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{ type: types.REQUEST_COUNTRIES_FOR_SELECT_LISTS }], 'REQUEST_COUNTRIES_FOR_SELECT_LISTS Was Not Dispatched')
        })

        it('Should request a new list of countries from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/select-list'), 'A request to /geography/select-list was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_SELECT_LISTS action with the countries received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedCountriesToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_COUNTRIES_FOR_SELECT_LISTS,
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
          fetchStub.aspectFetch.withArgs('/geography/select-list')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          countryCreators = proxyquire('./country_creators', {
            '../utils/fetch': fetchStub
          })
          const moreThanFiveMinutesAgo = new Date(now - 300001)
          const dispatchFunction = countryCreators.fetchCountriesForSelectLists(true, moreThanFiveMinutesAgo)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_SELECT_LISTS action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{ type: types.REQUEST_COUNTRIES_FOR_SELECT_LISTS }], 'REQUEST_COUNTRIES_FOR_SELECT_LISTS Was Not Dispatched')
        })

        it('Should request a new list of countries from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/select-list'), 'A request to /geography/select-list was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_SELECT_LISTS action with the countries received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedCountriesToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_COUNTRIES_FOR_SELECT_LISTS,
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
          fetchStub.aspectFetch.withArgs('/geography/select-list')
            .returns(expectedResponseFromServer)
          dispatch = sinon.spy()
          countryCreators = proxyquire('./country_creators', {
            '../utils/fetch': fetchStub
          })
          const dispatchFunction = countryCreators.fetchCountriesForSelectLists(true)
          dispatchFunction(dispatch)
        })

        it('Should dispatch a REQUEST_COUNTRIES_FOR_SELECT_LISTS action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{ type: types.REQUEST_COUNTRIES_FOR_SELECT_LISTS }], 'REQUEST_COUNTRIES_FOR_SELECT_LISTS Was Not Dispatched')
        })

        it('Should request a new list of countries from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/geography/select-list'), 'A request to /geography/select-list was not detected')
        })

        describe('and a response is received from the server', () => {
          it('Should dispatch a RECEIVE_COUNTRIES_FOR_SELECT_LISTS action with the countries received and the current date', () => {
            return expectedResponseFromServer.then(response => {
              assert.deepEqual(response, {ok: true, data: expectedCountriesToDispatch})
              assert.deepEqual(dispatch.secondCall.args, [{
                type: types.RECEIVE_COUNTRIES_FOR_SELECT_LISTS,
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
        fetchStub.aspectFetch.withArgs('/geography/select-list')
          .returns(expectedResponseFromServer)
        errorCreatorsStub = {
          addError: sinon.stub()
        }
        errorCreatorsStub.addError.withArgs('Loading countries failed', expectedError.message, expectedError)
          .returns(expectedErrorAction)
        dispatch = sinon.spy()
        countryCreators = proxyquire('./country_creators', {
          '../utils/fetch': fetchStub,
          './error_creators': errorCreatorsStub
        })
        const dispatchFunction = countryCreators.fetchCountriesForSelectLists(true, now)
        dispatchFunction(dispatch)
      })

      it('Should dispatch a REQUEST_COUNTRIES_FOR_SELECT_LISTS action', () => {
        assert.deepEqual(dispatch.firstCall.args, [{ type: types.REQUEST_COUNTRIES_FOR_SELECT_LISTS }], 'REQUEST_COUNTRIES_FOR_SELECT_LISTS Was Not Dispatched')
      })

      it('Should request a new list of countries from the server', () => {
        assert(fetchStub.aspectFetch.calledWith('/geography/select-list'), 'A request to /geography/select-list was not detected')
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
