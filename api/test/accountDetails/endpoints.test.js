const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../utils/endpointUtils')

describe('account details endpoints', () => {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/accountDetails/endpoints', {
      './service': serviceStub,
    })
    return _.find(endpoints, { method, path })
  }

  describe('/account-details/current', () => {
    describe('GET', () => {
      let endpoint
      const expectedResponse = { value: 'Expected account details' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/account-details/current', {
          *getAccountDetailsForLoggedInUser() {
            return expectedResponse
          },
        })
      })

      it('Should respond with a the data returned from the service', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .handleResponseWith(response => {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('PUT', () => {
      let endpoint
      const expectedResponse = { value: 'Expected account details' }

      beforeEach(() => {
        endpoint = setupRoute('PUT', '/account-details/current-contact', {
          *saveContactDetailsForLoggedInUser() {
            return expectedResponse
          },
        })
      })

      it('Should respond with a the data returned from the service', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .handleResponseWith(response => {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })
  })
})
