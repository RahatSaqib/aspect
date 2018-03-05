const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../utils/endpointUtils')

describe('account details endpoints', () => {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/accountDetails/endpoints', {
      './service': serviceStub,
    })
    return _.find(endpoints.routes, { method, path })
  }

  describe('GET', () => {
    describe('account-details/current', () => {
      let endpoint
      const expectedResponse = { value: 'Expected account details' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/account-details/current', {
          async getAccountDetailsForLoggedInUser() {
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

  describe('PUT', () => {
    describe('account-details/current-contact', () => {
      let endpoint
      const expectedResponse = { value: 'Expected account details' }

      beforeEach(() => {
        endpoint = setupRoute('PUT', '/account-details/current-contact', {
          async saveContactDetailsForLoggedInUser() {
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

    describe('account-details/current-preferences', () => {
      let endpoint
      const expectedResponse = { value: 'Expected account details ' }

      beforeEach(() => {
        endpoint = setupRoute('PUT', '/account-details/current-preferences', {
          async saveUserPreferencesForLoggedInUser() {
            return expectedResponse
          },
        })
      })

      it('Should respond with the data returned from service', done => {
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
