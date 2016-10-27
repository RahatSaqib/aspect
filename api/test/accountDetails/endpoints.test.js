let proxyquire = require('proxyquire')
let {assert} = require('chai')
let _ = require('lodash')
let endpointUtils = require('../utils/endpointUtils')

describe('account details endpoints', function () {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/accountDetails/endpoints', {
      './service': serviceStub
    })
    return _.find(endpoints, {method: method, path: path})
  }

  describe('/account-details/current', function () {
    describe('GET', function () {
      let endpoint
      const expectedResponse = { value: 'Expected account details'}

      beforeEach(function () {
        endpoint = setupRoute('GET', '/account-details/current', {
          getAccountDetailsForLoggedInUser: function* () { return expectedResponse }
        })
      })

      it('Should respond with a the data returned from the service', function (done) {
        endpointUtils.callHandlerOn(endpoint)
          .handleResponseWith(function (response) {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('PUT', function () {
      let endpoint
      const expectedResponse = { value: 'Expected account details'}

      beforeEach(function () {
        endpoint = setupRoute('PUT', '/account-details/current-contact', {
          saveContactDetailsForLoggedInUser: function* () { return expectedResponse }
        })
      })

      it('Should respond with a the data returned from the service', function (done) {
        endpointUtils.callHandlerOn(endpoint)
          .handleResponseWith(function (response) {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })
  })
})
